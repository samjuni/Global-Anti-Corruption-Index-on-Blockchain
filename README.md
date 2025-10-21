# 🌍 Global Anti-Corruption Index on Blockchain

Welcome to a decentralized platform for building and maintaining global anti-corruption indices! This Web3 project leverages the Stacks blockchain and Clarity smart contracts to enable transparent, shared data contributions from governments, NGOs, journalists, and citizens. By crowdsourcing verifiable data on corruption metrics (e.g., bribery reports, transparency scores, and public fund audits), it creates immutable, real-time indices that combat corruption worldwide—solving the real-world problem of opaque, centralized corruption tracking that often leads to manipulation and distrust.

## ✨ Features
🔍 Submit verified corruption data from anywhere  
📊 Calculate dynamic anti-corruption indices per country/region  
🗳️ Community governance for data validation and updates  
💰 Reward contributors with tokens for high-quality submissions  
⚖️ Dispute resolution for contested data  
📈 Query and visualize indices publicly  
🔒 Immutable audit trails for all contributions  
🚫 Prevent spam or fraudulent data through staking  

## 🛠 How It Works
This project uses 8 Clarity smart contracts to handle data integrity, computation, and governance in a decentralized manner. Data is submitted as hashes or structured entries, verified via multi-party consensus, and aggregated into indices like a Corruption Perception Score (inspired by real-world benchmarks but fully on-chain).

**For Data Contributors (e.g., Journalists or NGOs)**  
- Gather evidence (e.g., documents, reports) and generate a hash.  
- Stake tokens to submit via the DataSubmissionContract.  
- Call `submit-data` with:  
  - Data hash or JSON payload (e.g., country, corruption type, evidence link).  
  - Category (e.g., "bribery" or "embezzlement").  
Your submission enters a verification queue—earn rewards if approved!

**For Verifiers (e.g., Community Members)**  
- Review pending submissions using `get-pending-data` from VerificationContract.  
- Vote to approve/reject via `verify-submission` (requires staking).  
- Use DisputeResolutionContract if conflicts arise.  
Consensus builds trust without central authorities.

**For Index Users (e.g., Researchers or Policymakers)**  
- Query real-time indices with `get-country-index` from IndexCalculationContract.  
- View historical data via AuditContract for transparency.  
- Participate in governance votes through GovernanceContract to update calculation formulas.

**Smart Contracts Overview**  
1. **UserRegistryContract**: Registers contributors and verifiers, managing identities and staking requirements.  
2. **DataSubmissionContract**: Handles submission of corruption data, enforcing formats and anti-spam measures.  
3. **VerificationContract**: Manages multi-signature verification and voting on data validity.  
4. **IndexCalculationContract**: Aggregates approved data to compute indices (e.g., weighted averages per country).  
5. **GovernanceContract**: Enables DAO-style voting for system parameters, like reward rates or verification thresholds.  
6. **RewardContract**: Distributes tokens to successful contributors and verifiers based on contributions.  
7. **DisputeResolutionContract**: Resolves conflicts through arbitration or community juries.  
8. **AuditContract**: Provides immutable logs and queries for all actions, ensuring full transparency.

Boom! A tamper-proof system that empowers global anti-corruption efforts. Deploy on Stacks for Bitcoin-secured settlement.