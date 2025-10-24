pragma solidity ^ 0.8.0;

contract JobMarketplace {
  address public owner;
  uint256 public jobCounter;
  uint256 public platformFeePercent = 2;

  enum JobStatus {
    Open,
    InProgress,
    Completed,
    Cancelled,
    Disputed
  }

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

  struct Application {
    address applicant;
    string proposal;
    uint256 appliedAt;
    bool exists;
  }

  mapping(uint256 = > Job) public jobs;
  mapping(uint256 = > Application[]) public jobApplications;
  mapping(uint256 = > mapping(address = > bool)) public hasApplied;

  event JobCreated(uint256 indexed jobId, address indexed employer,
                   string title, uint256 budget);
  event JobApplied(uint256 indexed jobId, address indexed applicant);
  
  event FreelancerHired(uint256 indexed jobId, address indexed freelancer);
  
  event JobCompleted(uint256 indexed jobId, address indexed freelancer,
                     uint256 payment);
  event JobCancelled(uint256 indexed jobId);

  modifier onlyOwner() {
    require(msg.sender == owner, "Only owner can call this");
    _;
  }

  modifier onlyEmployer(uint256 _jobId) {
    require(jobs[_jobId].employer == msg.sender, "Only employer can call this");
    _;
  }

  modifier onlyFreelancer(uint256 _jobId) {
    require(jobs[_jobId].freelancer == msg.sender,
            "Only assigned freelancer can call this");
    _;
  }

  modifier jobExists(uint256 _jobId) {
    require(_jobId > 0 && _jobId <= jobCounter, "Job does not exist");
    _;
  }

  constructor() { owner = msg.sender; }

  function createJob(string memory _title, string memory _description,
                     uint256 _deadline) external payable returns(uint256) {
    require(msg.value > 0, "Budget must be greater than 0");
    require(_deadline > block.timestamp, "Deadline must be in the future");

    jobCounter++;

    jobs[jobCounter] = Job({
      jobId : jobCounter,
      employer : msg.sender,
      freelancer : address(0),
      title : _title,
      description : _description,
      budget : msg.value,
      deadline : _deadline,
      status : JobStatus.Open,
      fundsDeposited : true,
      createdAt : block.timestamp
    });

    emit JobCreated(jobCounter, msg.sender, _title, msg.value);
    emit FundsDeposited(jobCounter, msg.value);

    return jobCounter;
  }

  function applyForJob(uint256 _jobId, string memory _proposal)
      external jobExists(_jobId) {
    Job storage job = jobs[_jobId];
    require(job.status == JobStatus.Open, "Job is not open");
    require(msg.sender != job.employer, "Employer cannot apply to own job");
    require(!hasApplied[_jobId][msg.sender], "Already applied to this job");

    jobApplications[_jobId].push(Application({
      applicant : msg.sender,
      proposal : _proposal,
      appliedAt : block.timestamp,
      exists : true
    }));

    hasApplied[_jobId][msg.sender] = true;

    emit JobApplied(_jobId, msg.sender);
  }

  function hireFreelancer(uint256 _jobId, address _freelancer)
      external jobExists(_jobId) onlyEmployer(_jobId) {
    Job storage job = jobs[_jobId];
    require(job.status == JobStatus.Open, "Job is not open");
    require(hasApplied[_jobId][_freelancer], "Freelancer has not applied");
    require(job.fundsDeposited, "Funds not deposited");

    job.freelancer = _freelancer;
    job.status = JobStatus.InProgress;

    emit FreelancerHired(_jobId, _freelancer);
  }

  function completeJob(uint256 _jobId) external jobExists(_jobId)
      onlyEmployer(_jobId) {
    Job storage job = jobs[_jobId];
    require(job.status == JobStatus.InProgress, "Job is not in progress");
    require(job.fundsDeposited, "Funds not available");

    job.status = JobStatus.Completed;

    uint256 platformFee = (job.budget * platformFeePercent) / 100;
    uint256 freelancerPayment = job.budget - platformFee;

    payable(job.freelancer).transfer(freelancerPayment);
    payable(owner).transfer(platformFee);

    job.fundsDeposited = false;

    emit JobCompleted(_jobId, job.freelancer, freelancerPayment);
  }

  function cancelJob(uint256 _jobId) external jobExists(_jobId)
      onlyEmployer(_jobId) {
    Job storage job = jobs[_jobId];
    require(job.status == JobStatus.Open, "Can only cancel open jobs");
    require(job.fundsDeposited, "Funds already withdrawn");

    job.status = JobStatus.Cancelled;

    payable(job.employer).transfer(job.budget);
    job.fundsDeposited = false;

    emit JobCancelled(_jobId);
  }

  function getJobApplications(uint256 _jobId) external view jobExists(_jobId)
      returns(Application[] memory) {
    return jobApplications[_jobId];
  }

  function getJob(uint256 _jobId) external view jobExists(_jobId)
      returns(Job memory) {
    return jobs[_jobId];
  }

  function setPlatformFee(uint256 _newFeePercent) external onlyOwner {
    require(_newFeePercent <= 10, "Fee cannot exceed 10%");
    platformFeePercent = _newFeePercent;
  }
}
