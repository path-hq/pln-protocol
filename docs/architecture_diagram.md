
```mermaid
graph TD
    subgraph Legend
        direction LR
        sns_icon[(󠁛SNS)]
        jupiter_icon(Jupiter)
        kamino_icon(Kamino)
        meteora_icon(Meteora)
    end
    subgraph Core Entities & Flows
        L[Lender] -- Deposit Stablecoins --> LR(Liquidity Router)

        LR -- Allocate Capital --> K_POOL[Kamino Lending Pool]
        K_POOL -- Yield --> L

        LR -- Allocate Capital --> CMD[Credit Market Program (P2P Lending)]

        subgraph Agent Lifecycle
            A(Agent) -- Identity via --> SNS_ID(SNS Domain '.pln.sol')
            SNS_ID --> RP{Reputation Program}
            RP -- Score --> A
            CMD -- Borrow Request --> A
            A -- Borrow Funds --> CE[Constrained Execution Environment]
            CE -- Swap/Yield Ops (e.g., Jupiter, Kamino, Meteora) --> DEX[DEXes / Lending Protocols]
            DEX -- Return Funds (via Transfer Hook) --> CE
            CE -- Repay Loan --> CMD
            CMD -- Update --> RP
        end

    end

    subgraph Cross-Cutting Concerns
        TH[Token-2022 Transfer Hook] -- Enforces Whitelist / Compliance --> LR
        TH -- Validates On-Chain Actions --> CE
    end

    style L fill:#f9f,stroke:#333,stroke-width:2px;
    style LR fill:#ccf,stroke:#333,stroke-width:2px;
    style K_POOL fill:#bfb,stroke:#333,stroke-width:2px;
    style CMD fill:#fcf,stroke:#333,stroke-width:2px;
    style DEX fill:#ffb,stroke:#333,stroke-width:2px;
    style TH fill:#fcf,stroke:#333,stroke-width:2px;
    style A fill:#dfd,stroke:#333,stroke-width:2px;
    style SNS_ID fill:#ddd,stroke:#333,stroke-width:2px;
    style RP fill:#fcf,stroke:#333,stroke-width:2px;
    style CE fill:#f9c,stroke:#333,stroke-width:2px;

```