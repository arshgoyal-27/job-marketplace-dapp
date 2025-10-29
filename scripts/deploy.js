import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  console.log('Deploying JobMarketplace...');
  const ContractFactory = await ethers.getContractFactory('JobMarketplace');
  const contract = await ContractFactory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('Contract deployed to:', address);

  // Ensure frontend src exists (artifacts are already configured to output there)
  const frontendSrcDir = path.join(__dirname, '..', 'web', 'src');
  if (!fs.existsSync(frontendSrcDir)) {
    fs.mkdirSync(frontendSrcDir, { recursive: true });
  }

  // Write Vite env var with deployed address for the frontend
  const envPath = path.join(__dirname, '..', 'web', '.env');
  const envLine = `VITE_JOB_MARKETPLACE_ADDRESS=${address}`;
  try {
    if (fs.existsSync(envPath)) {
      let existing = fs.readFileSync(envPath, 'utf8');
      const key = 'VITE_JOB_MARKETPLACE_ADDRESS=';
      const lines = existing.split(/\r?\n/);
      let updated = false;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith(key)) {
          lines[i] = envLine;
          updated = true;
        }
      }
      if (!updated) lines.push(envLine);
      existing = lines.filter(Boolean).join('\n') + '\n';
      fs.writeFileSync(envPath, existing, 'utf8');
    } else {
      fs.writeFileSync(envPath, envLine + '\n', 'utf8');
    }
    console.log('Updated frontend env:', envPath);
  } catch (e) {
    console.warn('Failed to write web/.env:', e);
  }

  // Optionally also save minimal contract data for debugging
  const dataPath = path.join(frontendSrcDir, 'contractData.json');
  const contractData = {
    address,
    abi: JSON.parse(contract.interface.formatJson()),
  };
  fs.writeFileSync(dataPath, JSON.stringify(contractData, null, 2));
  console.log('Saved contract data to:', dataPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
