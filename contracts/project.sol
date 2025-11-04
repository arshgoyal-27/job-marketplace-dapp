// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title JobMarketplace
 * @dev A decentralized job marketplace connecting employers and freelancers
 */
contract JobMarketplace {
    
    enum JobStatus { Open, InProgress, Completed, Cancelled, Disputed }
    
    struct Job {
        uint256 jobId;
        address employer;
        address freelancer;
        string title;
        string description;
        uint256 budget;
        uint256 deadline;
        JobStatus status;
        bool fundsDeposited;
        uint256 createdAt;
    }
    
    struct Proposal {
        address freelancer;
        uint256 proposedAmount;
        string coverLetter;
        uint256 submittedAt;
        bool accepted;
    }
    
    // State variables
    uint256 private jobCounter;
    uint256 public platformFeePercentage = 2; // 2% platform fee
    address public platformOwner;
    
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Proposal[]) public jobProposals;
    mapping(address => uint256[]) private employerJobs;
    mapping(address => uint256[]) private freelancerJobs;
    mapping(uint256 => uint256) private escrowFunds;
    
    // Events
    event JobPosted(uint256 indexed jobId, address indexed employer, string title, uint256 budget);
    event ProposalSubmitted(uint256 indexed jobId, address indexed freelancer, uint256 proposedAmount);
    event JobAssigned(uint256 indexed jobId, address indexed freelancer);
    event JobCompleted(uint256 indexed jobId, address indexed freelancer, uint256 payment);
    event JobCancelled(uint256 indexed jobId);
    event FundsReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount);
    
    modifier onlyEmployer(uint256 _jobId) {
        require(jobs[_jobId].employer == msg.sender, "Only employer can perform this action");
        _;
    }
    
    modifier onlyFreelancer(uint256 _jobId) {
        require(jobs[_jobId].freelancer == msg.sender, "Only assigned freelancer can perform this action");
        _;
    }
    
    modifier jobExists(uint256 _jobId) {
        require(_jobId > 0 && _jobId <= jobCounter, "Job does not exist");
        _;
    }
    
    constructor() {
        platformOwner = msg.sender;
    }
    
    /**
     * @dev Post a new job listing
     * @param _title Job title
     * @param _description Job description and requirements
     * @param _budget Job budget in wei
     * @param _deadline Unix timestamp for job deadline
     */
    function postJob(
        string memory _title,
        string memory _description,
        uint256 _budget,
        uint256 _deadline
    ) external payable returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_budget > 0, "Budget must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(msg.value >= _budget, "Must deposit full budget amount");
        
        jobCounter++;
        
        jobs[jobCounter] = Job({
            jobId: jobCounter,
            employer: msg.sender,
            freelancer: address(0),
            title: _title,
            description: _description,
            budget: _budget,
            deadline: _deadline,
            status: JobStatus.Open,
            fundsDeposited: true,
            createdAt: block.timestamp
        });
        
        escrowFunds[jobCounter] = _budget;
        employerJobs[msg.sender].push(jobCounter);
        
        // Refund excess payment
        if (msg.value > _budget) {
            payable(msg.sender).transfer(msg.value - _budget);
        }
        
        emit JobPosted(jobCounter, msg.sender, _title, _budget);
        return jobCounter;
    }
    
    /**
     * @dev Submit a proposal for a job
     * @param _jobId ID of the job
     * @param _proposedAmount Proposed amount for the job
     * @param _coverLetter Freelancer's cover letter/proposal
     */
    function submitProposal(
        uint256 _jobId,
        uint256 _proposedAmount,
        string memory _coverLetter
    ) external jobExists(_jobId) {
        Job storage job = jobs[_jobId];
        
        require(job.status == JobStatus.Open, "Job is not open for proposals");
        require(msg.sender != job.employer, "Employer cannot submit proposal");
        require(_proposedAmount > 0, "Proposed amount must be greater than 0");
        require(_proposedAmount <= job.budget, "Proposed amount exceeds budget");
        require(bytes(_coverLetter).length > 0, "Cover letter cannot be empty");
        
        // Check if freelancer already submitted a proposal
        Proposal[] storage proposals = jobProposals[_jobId];
        for (uint i = 0; i < proposals.length; i++) {
            require(proposals[i].freelancer != msg.sender, "Proposal already submitted");
        }
        
        jobProposals[_jobId].push(Proposal({
            freelancer: msg.sender,
            proposedAmount: _proposedAmount,
            coverLetter: _coverLetter,
            submittedAt: block.timestamp,
            accepted: false
        }));
        
        emit ProposalSubmitted(_jobId, msg.sender, _proposedAmount);
    }
    
    /**
     * @dev Accept a proposal and assign the job to a freelancer
     * @param _jobId ID of the job
     * @param _proposalIndex Index of the proposal to accept
     */
    function acceptProposal(
        uint256 _jobId,
        uint256 _proposalIndex
    ) external jobExists(_jobId) onlyEmployer(_jobId) {
        Job storage job = jobs[_jobId];
        
        require(job.status == JobStatus.Open, "Job is not open");
        require(_proposalIndex < jobProposals[_jobId].length, "Invalid proposal index");
        
        Proposal storage proposal = jobProposals[_jobId][_proposalIndex];
        
        job.freelancer = proposal.freelancer;
        job.status = JobStatus.InProgress;
        proposal.accepted = true;
        
        freelancerJobs[proposal.freelancer].push(_jobId);
        
        emit JobAssigned(_jobId, proposal.freelancer);
    }
    
    /**
     * @dev Mark job as completed and release funds to freelancer
     * @param _jobId ID of the job
     */
    function completeJob(uint256 _jobId) external jobExists(_jobId) onlyEmployer(_jobId) {
        Job storage job = jobs[_jobId];
        
        require(job.status == JobStatus.InProgress, "Job is not in progress");
        require(job.freelancer != address(0), "No freelancer assigned");
        
        job.status = JobStatus.Completed;
        
        // Calculate platform fee and freelancer payment
        uint256 platformFee = (escrowFunds[_jobId] * platformFeePercentage) / 100;
        uint256 freelancerPayment = escrowFunds[_jobId] - platformFee;
        
        // Transfer funds
        payable(platformOwner).transfer(platformFee);
        payable(job.freelancer).transfer(freelancerPayment);
        
        escrowFunds[_jobId] = 0;
        
        emit JobCompleted(_jobId, job.freelancer, freelancerPayment);
        emit FundsReleased(_jobId, job.freelancer, freelancerPayment);
    }
    
    // View functions
    function getJobDetails(uint256 _jobId) external view jobExists(_jobId) returns (
        address employer,
        address freelancer,
        string memory title,
        string memory description,
        uint256 budget,
        uint256 deadline,
        JobStatus status,
        uint256 createdAt
    ) {
        Job memory job = jobs[_jobId];
        return (
            job.employer,
            job.freelancer,
            job.title,
            job.description,
            job.budget,
            job.deadline,
            job.status,
            job.createdAt
        );
    }
    
    function getJobProposals(uint256 _jobId) external view jobExists(_jobId) returns (Proposal[] memory) {
        return jobProposals[_jobId];
    }
    
    function getEmployerJobs(address _employer) external view returns (uint256[] memory) {
        return employerJobs[_employer];
    }
    
    function getFreelancerJobs(address _freelancer) external view returns (uint256[] memory) {
        return freelancerJobs[_freelancer];
    }
    
    function getTotalJobs() external view returns (uint256) {
        return jobCounter;
    }
    
    function getEscrowBalance(uint256 _jobId) external view jobExists(_jobId) returns (uint256) {
        return escrowFunds[_jobId];
    }
    
    // Admin function to update platform fee
    function updatePlatformFee(uint256 _newFeePercentage) external {
        require(msg.sender == platformOwner, "Only platform owner can update fee");
        require(_newFeePercentage <= 10, "Fee cannot exceed 10%");
        platformFeePercentage = _newFeePercentage;
    }
}
