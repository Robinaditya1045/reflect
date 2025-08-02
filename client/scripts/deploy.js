const path = require("path");
const fs = require("fs");

async function main() {
  const TopG = await ethers.getContractFactory("TopG");
  const simpleStorage = await TopG.deploy();

  await simpleStorage.deployed();
  console.log("TopG deployed to:", simpleStorage.address);
  saveFrontendFiles(simpleStorage, "TopG");
}

function saveFrontendFiles(contract, name) {
  const contractsDir = path.join(__dirname, "../src/contract_data/");

  // Ensure the directory exists
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Save contract address
  fs.writeFileSync(
    path.join(contractsDir, `${name}-address.json`),
    JSON.stringify({ address: contract.address }, undefined, 2)
  );

  // Save contract ABI
  const contractArtifact = artifacts.readArtifactSync(name);
  fs.writeFileSync(
    path.join(contractsDir, `${name}.json`),
    JSON.stringify(contractArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
