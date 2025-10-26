pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract JobMarketplace is ReentrancyGuard, Pausable, Ownable {
    uint256 public jobCounter;
    uint256 public platformFeePercent = 2;
    uint256 public constant MAX_PLATFORM_FEE = 10;
    uint256 public constant DISPUTE_TIMEOUT = 7 days;
    
    enum JobStatus {
        Open,
        InProgress,
        Completed,
        Cancelled,
        Disputed
    }
    
    struct Milestone {
        string description;
        uint256 amount;
        bool completed;
        bool approved;
        uint256 submittedAt;
    }
    
    struct Job {
        uint256 jobId;
        address employer;
        address freelancer;
        string title;
        string description;
        uint256 totalBudget;
        uint256 remainingBudget;
        uint256 deadline;
        JobStatus status;
        uint256 createdAt;
        uint256 disputeRaisedAt;
    }
    
    struct Application {
        address applicant;
        string proposal;
        uint256 proposedAmount;
        uint256 appliedAt;
    }
    
    struct Rating {
        address rater;
        address ratee;
        uint8 score; // 1-5
        string review;
        uint256 jobId;
        uint256 timestamp;
    }
    
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Milestone[]) public jobMilestones;
    mapping(uint256 => Application[]) public jobApplications;
    mapping(uint256 => mapping(address => bool)) public hasApplied;
    mapping(uint256 => mapping(address => bool)) public hasRated;
    mapping(address => Rating[]) public userRatings;
    mapping(address => uint256) public userTotalRating;
    mapping(address => uint256) public userRatingCount;
    
    event JobCreated(uint256 indexed jobId, address indexed employer, string title, uint256 budget);
    event JobApplied(uint256 indexed jobId, address indexed applicant, uint256 proposedAmount);
    event FreelancerHired(uint256 indexed jobId, address indexed freelancer);
    event MilestoneAdded(uint256 indexed jobId, uint256 milestoneIndex, uint256 amount);
    event MilestoneSubmitted(uint256 indexed jobId, uint256 milestoneIndex, address indexed freelancer);
    event MilestoneApproved(uint256 indexed jobId, uint256 milestoneIndex, uint256 payment);
    event JobCompleted(uint256 indexed jobId, address indexed freelancer, uint256 totalPayment);
    event JobCancelled(uint256 indexed jobId, uint256 refundAmount);
    event DisputeRaised(uint256 indexed jobId, address indexed raisedBy);
    event DisputeResolved(uint256 indexed jobId, bool favorFreelancer, uint256 amount);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    
    modifier onlyEmployer(uint256 _jobId) {
        require(jobs[_jobId].employer == msg.sender, "Only employer can call");
        _;
    }
    
    modifier onlyFreelancer(uint256 _jobId) {
        require(jobs[_jobId].freelancer == msg.sender, "Only assigned freelancer can call");
        _;
    }
    
    modifier jobExists(uint256 _jobId) {
        require(_jobId > 0 && _jobId <= jobCounter, "Job does not exist");
        _;
    }
    
    constructor() Ownable(msg.sender) {}
    
    function createJob(
        string memory _title,
        string memory _description,
        uint256 _deadline
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(msg.value > 0, "Budget must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in future");
        require(bytes(_title).length > 0, "Title cannot be empty");
        
        jobCounter++;
        
        jobs[jobCounter] = Job({
            jobId: jobCounter,
            employer: msg.sender,
            freelancer: address(0),
            title: _title,
            description: _description,
            totalBudget: msg.value,
            remainingBudget: msg.value,
            deadline: _deadline,
            status: JobStatus.Open,
            createdAt: block.timestamp,
            disputeRaisedAt: 0
        });
        
        emit JobCreated(jobCounter, msg.sender, _title, msg.value);
        
        return jobCounter;
    }
    
    function addMilestones(
        uint256 _jobId,
        string[] memory _descriptions,
        uint256[] memory _amounts
    ) external jobExists(_jobId) onlyEmployer(_jobId) {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Open, "Can only add milestones to open jobs");
        require(_descriptions.length == _amounts.length, "Arrays length mismatch");
        require(_descriptions.length > 0, "Must add at least one milestone");
        
        uint256 totalMilestoneAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            require(_amounts[i] > 0, "Milestone amount must be > 0");
            totalMilestoneAmount += _amounts[i];
            
            jobMilestones[_jobId].push(Milestone({
                description: _descriptions[i],
                amount: _amounts[i],
                completed: false,
                approved: false,
                submittedAt: 0
            }));
            
            emit MilestoneAdded(_jobId, i, _amounts[i]);
        }
        
        require(totalMilestoneAmount <= job.totalBudget, "Milestones exceed budget");
    }
    
    function applyForJob(
        uint256 _jobId,
        string memory _proposal,
        uint256 _proposedAmount
    ) external jobExists(_jobId) whenNotPaused {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Open, "Job is not open");
        require(msg.sender != job.employer, "Employer cannot apply");
        require(!hasApplied[_jobId][msg.sender], "Already applied");
        require(_proposedAmount > 0, "Proposed amount must be > 0");
        
        jobApplications[_jobId].push(Application({
            applicant: msg.sender,
            proposal: _proposal,
            proposedAmount: _proposedAmount,
            appliedAt: block.timestamp
        }));
        
        hasApplied[_jobId][msg.sender] = true;
        
        emit JobApplied(_jobId, msg.sender, _proposedAmount);
    }
    
    function hireFreelancer(uint256 _jobId, address _freelancer)
        external
        jobExists(_jobId)
        onlyEmployer(_jobId)
        whenNotPaused
    {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Open, "Job is not open");
        require(hasApplied[_jobId][_freelancer], "Freelancer has not applied");
        require(_freelancer != address(0), "Invalid freelancer address");
        
        job.freelancer = _freelancer;
        job.status = JobStatus.InProgress;
        
        emit FreelancerHired(_jobId, _freelancer);
    }
    
    function submitMilestone(uint256 _jobId, uint256 _milestoneIndex)
        external
        jobExists(_jobId)
        onlyFreelancer(_jobId)
        whenNotPaused
    {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.InProgress, "Job not in progress");
        require(_milestoneIndex < jobMilestones[_jobId].length, "Invalid milestone");
        
        Milestone storage milestone = jobMilestones[_jobId][_milestoneIndex];
        require(!milestone.completed, "Milestone already submitted");
        
        milestone.completed = true;
        milestone.submittedAt = block.timestamp;
        
        emit MilestoneSubmitted(_jobId, _milestoneIndex, msg.sender);
    }
    
    function approveMilestone(uint256 _jobId, uint256 _milestoneIndex)
        external
        jobExists(_jobId)
        onlyEmployer(_jobId)
        nonReentrant
        whenNotPaused
    {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.InProgress, "Job not in progress");
        require(_milestoneIndex < jobMilestones[_jobId].length, "Invalid milestone");
        
        Milestone storage milestone = jobMilestones[_jobId][_milestoneIndex];
        require(milestone.completed, "Milestone not submitted");
        require(!milestone.approved, "Milestone already approved");
        require(job.remainingBudget >= milestone.amount, "Insufficient budget");
        
        milestone.approved = true;
        
        uint256 platformFee = (milestone.amount * platformFeePercent) / 100;
        uint256 freelancerPayment = milestone.amount - platformFee;
        
        job.remainingBudget -= milestone.amount;
        
        (bool successFreelancer, ) = payable(job.freelancer).call{value: freelancerPayment}("");
        require(successFreelancer, "Freelancer payment failed");
        
        (bool successOwner, ) = payable(owner()).call{value: platformFee}("");
        require(successOwner, "Platform fee transfer failed");
        
        emit MilestoneApproved(_jobId, _milestoneIndex, freelancerPayment);
        
        if (_areAllMilestonesApproved(_jobId)) {
            job.status = JobStatus.Completed;
            emit JobCompleted(_jobId, job.freelancer, job.totalBudget - job.remainingBudget);
        }
    }
    
    function completeJob(uint256 _jobId)
        external
        jobExists(_jobId)
        onlyEmployer(_jobId)
        nonReentrant
        whenNotPaused
    {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.InProgress, "Job not in progress");
        require(jobMilestones[_jobId].length == 0, "Use milestone approval for jobs with milestones");
        require(job.remainingBudget > 0, "No funds available");
        
        uint256 amount = job.remainingBudget;
        uint256 platformFee = (amount * platformFeePercent) / 100;
        uint256 freelancerPayment = amount - platformFee;
        
        job.status = JobStatus.Completed;
        job.remainingBudget = 0;
        
        (bool successFreelancer, ) = payable(job.freelancer).call{value: freelancerPayment}("");
        require(successFreelancer, "Freelancer payment failed");
        
        (bool successOwner, ) = payable(owner()).call{value: platformFee}("");
        require(successOwner, "Platform fee transfer failed");
        
        emit JobCompleted(_jobId, job.freelancer, freelancerPayment);
    }
    
    function cancelJob(uint256 _jobId)
        external
        jobExists(_jobId)
        onlyEmployer(_jobId)
        nonReentrant
        whenNotPaused
    {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Open, "Can only cancel open jobs");
        require(job.remainingBudget > 0, "No funds to refund");
        
        uint256 refundAmount = job.remainingBudget;
        
        job.status = JobStatus.Cancelled;
        job.remainingBudget = 0;
        
        (bool success, ) = payable(job.employer).call{value: refundAmount}("");
        require(success, "Refund failed");
        
        emit JobCancelled(_jobId, refundAmount);
    }
    
    function raiseDispute(uint256 _jobId)
        external
        jobExists(_jobId)
        whenNotPaused
    {
        Job storage job = jobs[_jobId];
        require(
            msg.sender == job.employer || msg.sender == job.freelancer,
            "Only employer or freelancer"
        );
        require(job.status == JobStatus.InProgress, "Job must be in progress");
        require(job.disputeRaisedAt == 0, "Dispute already raised");
        
        job.status = JobStatus.Disputed;
        job.disputeRaisedAt = block.timestamp;
        
        emit DisputeRaised(_jobId, msg.sender);
    }
    
    function resolveDispute(
        uint256 _jobId,
        bool _favorFreelancer,
        uint256 _freelancerAmount
    ) external jobExists(_jobId) onlyOwner nonReentrant {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Disputed, "Job not disputed");
        require(job.remainingBudget > 0, "No funds available");
        require(_freelancerAmount <= job.remainingBudget, "Amount exceeds budget");
        
        uint256 remainingAmount = job.remainingBudget;
        job.remainingBudget = 0;
        
        if (_favorFreelancer) {
            uint256 platformFee = (_freelancerAmount * platformFeePercent) / 100;
            uint256 freelancerPayment = _freelancerAmount - platformFee;
            uint256 employerRefund = remainingAmount - _freelancerAmount;
            
            job.status = JobStatus.Completed;
            
            if (freelancerPayment > 0) {
                (bool successFreelancer, ) = payable(job.freelancer).call{value: freelancerPayment}("");
                require(successFreelancer, "Freelancer payment failed");
            }
            
            if (platformFee > 0) {
                (bool successOwner, ) = payable(owner()).call{value: platformFee}("");
                require(successOwner, "Platform fee transfer failed");
            }
            
            if (employerRefund > 0) {
                (bool successEmployer, ) = payable(job.employer).call{value: employerRefund}("");
                require(successEmployer, "Employer refund failed");
            }
        } else {
            job.status = JobStatus.Cancelled;
            (bool success, ) = payable(job.employer).call{value: remainingAmount}("");
            require(success, "Employer refund failed");
        }
        
        emit DisputeResolved(_jobId, _favorFreelancer, _freelancerAmount);
    }
    
    function withdrawAfterDeadline(uint256 _jobId)
        external
        jobExists(_jobId)
        onlyEmployer(_jobId)
        nonReentrant
        whenNotPaused
    {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.InProgress, "Job not in progress");
        require(block.timestamp > job.deadline + DISPUTE_TIMEOUT, "Deadline not passed");
        require(job.remainingBudget > 0, "No funds available");
        
        uint256 refundAmount = job.remainingBudget;
        
        job.status = JobStatus.Cancelled;
        job.remainingBudget = 0;
        
        (bool success, ) = payable(job.employer).call{value: refundAmount}("");
        require(success, "Refund failed");
        
        emit FundsWithdrawn(job.employer, refundAmount);
    }
    
    function getJob(uint256 _jobId)
        external
        view
        jobExists(_jobId)
        returns (Job memory)
    {
        return jobs[_jobId];
    }
    
    function getJobApplications(uint256 _jobId)
        external
        view
        jobExists(_jobId)
        returns (Application[] memory)
    {
        return jobApplications[_jobId];
    }
    
    function getJobMilestones(uint256 _jobId)
        external
        view
        jobExists(_jobId)
        returns (Milestone[] memory)
    {
        return jobMilestones[_jobId];
    }
    
    function getUserRatings(address _user)
        external
        view
        returns (Rating[] memory)
    {
        return userRatings[_user];
    }
    
    function getUserAverageRating(address _user)
        external
        view
        returns (uint256)
    {
        if (userRatingCount[_user] == 0) return 0;
        return (userTotalRating[_user] * 100) / userRatingCount[_user];
    }
    
    function _areAllMilestonesApproved(uint256 _jobId)
        internal
        view
        returns (bool)
    {
        Milestone[] storage milestones = jobMilestones[_jobId];
        if (milestones.length == 0) return false;
        
        for (uint256 i = 0; i < milestones.length; i++) {
            if (!milestones[i].approved) return false;
        }
        return true;
    }
    
    function setPlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= MAX_PLATFORM_FEE, "Fee cannot exceed 10%");
        uint256 oldFee = platformFeePercent;
        platformFeePercent = _newFeePercent;
        emit PlatformFeeUpdated(oldFee, _newFeePercent);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    receive() external payable {
        revert("Direct payments not accepted");
    }
}