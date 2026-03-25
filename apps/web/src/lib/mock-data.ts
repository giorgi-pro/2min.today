export interface NewsItem {
  title: string
  content: string
  whyItMatters: string
  source: string
  isBreaking: boolean
}

export interface Category {
  name: string
  summary: string[]
  news: NewsItem[]
}

export const mockData: Category[] = [
  {
    name: 'World',
    summary: [
      'Ukraine–Russia ceasefire talks resume in Istanbul',
      'India–Pakistan border tensions escalate',
      'EU emergency migration summit after 400 drown',
      'China holds largest South China Sea drills since 2016',
      'UN deploys peacekeepers to Sudan after genocide ruling',
    ],
    news: [
      {
        title: 'Ukraine and Russia Hold First Direct Ceasefire Talks in Three Years',
        content:
          'Delegations from Ukraine and Russia met in Istanbul for preliminary ceasefire negotiations, marking the first direct diplomatic contact since early 2022. The talks, brokered by Turkey and the UAE, focused on prisoner exchanges and a potential 30-day truce along the eastern front.',
        whyItMatters:
          'Even a temporary halt to hostilities could unlock humanitarian corridors and set the framework for broader peace negotiations backed by the G7.',
        source: 'Reuters',
        isBreaking: true,
      },
      {
        title: 'India Recalls Ambassador After Cross-Border Strike Kills 12 in Pakistani Kashmir',
        content:
          'India recalled its high commissioner from Islamabad following an airstrike it attributed to Pakistani forces that killed 12 civilians in the Poonch district. Pakistan denied involvement, calling the incident a false flag operation. Both nations have placed border forces on high alert.',
        whyItMatters:
          'Any sustained escalation between two nuclear-armed states would destabilize the entire South Asian region and draw immediate responses from China and the US.',
        source: 'AP',
        isBreaking: false,
      },
      {
        title: 'EU Calls Emergency Summit on Migration After 400 Drown Off Libya',
        content:
          "European Union leaders convened an emergency session in Brussels after a single week saw over 400 migrants drown in the central Mediterranean. The deaths have reignited debate over the bloc's border policy ahead of scheduled elections in three member states.",
        whyItMatters:
          "The crisis is fueling far-right electoral momentum across Europe and straining the EU's Schengen framework, which faces border-closure threats from Italy and Greece.",
        source: 'AP',
        isBreaking: false,
      },
      {
        title: 'China Conducts Largest Naval Drills in South China Sea Since 2016',
        content:
          'The PLA Navy launched a five-day exercise involving 40 warships and carrier-based aircraft in disputed waters near the Spratly Islands. The drills coincide with a US-Philippines joint patrol in the same corridor, following a recent collision between Chinese coast guard vessels and Philippine supply boats.',
        whyItMatters:
          'The exercise is widely read as a direct signal to Manila and Washington ahead of planned US-Philippines bilateral defense treaty talks next month.',
        source: 'Reuters',
        isBreaking: false,
      },
      {
        title: 'UN Security Council Votes to Deploy Peacekeepers to Sudan After Genocide Finding',
        content:
          'The UN Security Council authorized a 10,000-strong peacekeeping mission to Darfur after an independent panel concluded the RSF militia committed acts of genocide. China and Russia abstained; all other members voted in favor. Deployment is expected within 90 days.',
        whyItMatters:
          "It is the Council's first unanimous genocide designation since Rwanda and sets a precedent for faster multilateral intervention in ongoing conflicts.",
        source: 'Reuters',
        isBreaking: false,
      },
    ],
  },
  {
    name: 'Business',
    summary: [
      'Fed signals rate-cut pause through mid-year',
      'NVIDIA crosses $4T market cap',
      'Amazon acquires Deliverr for $2.1B',
      'OPEC+ raises output by 400K barrels/day',
      'Container shipping rates drop 38%',
    ],
    news: [
      {
        title: 'Federal Reserve Signals Extended Pause on Rate Cuts Through Mid-Year',
        content:
          'Fed Chair Jerome Powell told Congress that persistent core inflation at 3.4% and a still-tight labor market mean the central bank is "in no hurry" to resume the easing cycle begun last September. Markets immediately repriced the first cut from March to July.',
        whyItMatters:
          'A longer hold keeps mortgage rates elevated, pressures commercial real estate refinancing, and delays relief for over-leveraged corporate borrowers facing wall-of-maturity deadlines.',
        source: 'WSJ',
        isBreaking: true,
      },
      {
        title: 'NVIDIA Becomes First Chipmaker to Surpass $4 Trillion in Market Capitalization',
        content:
          "Shares of NVIDIA rose 3.2% after the company posted quarterly revenue of $38.5 billion, beating estimates by $2.1 billion. The milestone makes it the second company in history—after Apple—to cross the $4T threshold. CEO Jensen Huang announced a $50 billion share buyback program.",
        whyItMatters:
          "NVIDIA's dominance in AI training hardware is now so entrenched that its valuation is effectively a proxy for market confidence in the entire AI buildout cycle.",
        source: 'Bloomberg',
        isBreaking: false,
      },
      {
        title: 'Amazon Acquires Deliverr for $2.1 Billion to Expand Same-Day Logistics Network',
        content:
          "Amazon agreed to acquire last-mile logistics startup Deliverr, giving it proprietary same-day fulfillment infrastructure for third-party sellers who do not use FBA. The deal faces EU and UK antitrust review. Deliverr currently serves 18,000 merchant clients.",
        whyItMatters:
          "The acquisition closes the last major gap in Amazon's fulfillment stack and sharpens its competitive edge against Shopify and TikTok Shop, both of which have been poaching third-party merchants.",
        source: 'AP',
        isBreaking: false,
      },
      {
        title: 'OPEC+ Votes to Raise Output by 400,000 Barrels Per Day Starting April',
        content:
          'The alliance agreed to its first meaningful production increase since 2022, citing stabilized demand projections and pressure from the US and EU to counter energy price inflation. Brent crude fell 4.1% on the news, reaching its lowest level in seven months.',
        whyItMatters:
          'Lower oil prices feed directly into transport and manufacturing costs, providing central banks with additional room to cut rates without stoking energy-driven inflation.',
        source: 'Reuters',
        isBreaking: false,
      },
      {
        title: 'Global Container Shipping Rates Drop 38% as Red Sea Rerouting Fades',
        content:
          'The Freightos Baltic Index fell to its lowest point in 18 months after Houthi attacks on commercial vessels ceased following a US-brokered regional ceasefire. Vessels are returning to the Suez Canal route, cutting Asia-to-Europe transit time by 10 days.',
        whyItMatters:
          'Normalized shipping rates will ease goods inflation in Europe and reduce inventory costs for manufacturers who spent 2024 over-ordering to buffer against transit delays.',
        source: 'Bloomberg',
        isBreaking: false,
      },
    ],
  },
  {
    name: 'Tech',
    summary: [
      'GPT-5 launches with 1M-token context',
      'Apple foldable iPhone enters mass production',
      'EU enforces AI Act on high-risk systems',
      'Lazarus Group breaches SWIFT, steals $340M',
      'Starship completes full orbital mission',
    ],
    news: [
      {
        title: 'OpenAI Releases GPT-5 With Native Reasoning and 1M Token Context Window',
        content:
          "OpenAI launched GPT-5 for ChatGPT Plus and API users, featuring a 1-million token context window, a built-in thinking mode for complex reasoning, and a claimed 40% reduction in hallucination rate on factual benchmarks. The model is multimodal across text, image, audio, and video.",
        whyItMatters:
          'A 1M-token context window enables entire codebases, legal contracts, and research corpora to be processed in a single query, fundamentally altering enterprise software workflows.',
        source: 'TechCrunch',
        isBreaking: true,
      },
      {
        title: 'Apple Confirms Foldable iPhone Entering Mass Production, Q4 Launch Expected',
        content:
          "Supply chain reports confirmed by Bloomberg Intelligence show Apple's first foldable iPhone—internally codenamed Clover—has entered mass production at Foxconn's Zhengzhou facility. The device features a 7.8-inch inner display and a carbon-fiber hinge mechanism.",
        whyItMatters:
          'Apple entering the foldable segment will mainstream the form factor and pressure Samsung and Google to accelerate next-generation Galaxy and Pixel Fold updates.',
        source: 'TechCrunch',
        isBreaking: false,
      },
      {
        title: 'EU Begins Enforcing AI Act High-Risk System Requirements',
        content:
          "The European Union's AI Act entered its enforcement phase for high-risk applications including medical devices, credit scoring, and biometric identification. Companies failing compliance audits face fines of up to 3% of global annual revenue. The first three enforcement notices were issued to financial institutions.",
        whyItMatters:
          'The enforcement phase sets the first binding global legal standard for AI deployment, compelling multinationals to update model governance practices worldwide to satisfy EU requirements.',
        source: 'Reuters',
        isBreaking: false,
      },
      {
        title: 'State-Linked Hackers Breach SWIFT Network at Six Central Banks, $340M Stolen',
        content:
          "A threat actor attributed by CrowdStrike to North Korea's Lazarus Group infiltrated the SWIFT interbank messaging network at six central banks across Southeast Asia and Eastern Europe. Approximately $340 million in fraudulent transfers were initiated before detection.",
        whyItMatters:
          'It is the largest successful SWIFT breach since Bangladesh Bank in 2016 and demonstrates that critical financial infrastructure remains vulnerable despite a decade of post-incident hardening.',
        source: 'AP',
        isBreaking: false,
      },
      {
        title: 'SpaceX Starship Completes First Full Orbital Mission, Catches Both Stages',
        content:
          "Starship's ninth integrated flight test achieved full orbital velocity, deployed a payload demonstration package, and successfully caught both the Super Heavy booster and the Ship vehicle using the mechazilla tower arms at Starbase, Texas—the first time both stages were recovered in a single mission.",
        whyItMatters:
          'Full reusability of both stages is the engineering prerequisite for the cost structure that makes Mars missions and NASA Artemis lunar contracts commercially viable.',
        source: 'TechCrunch',
        isBreaking: false,
      },
    ],
  },
  {
    name: 'Science',
    summary: [
      "Blood test predicts Alzheimer's 15 years early",
      'Antarctic ice loss 40% above projections',
      'Perseverance finds organics on Mars',
      'Muon experiment hints at fifth force',
      'Gene therapy cures Type 1 diabetes in trial',
    ],
    news: [
      {
        title: "Blood Biomarker Predicts Alzheimer's Onset 15 Years Before Symptoms",
        content:
          "A research team at the Karolinska Institute identified a panel of three plasma proteins that predicts Alzheimer's disease onset with 91% accuracy in a 15-year longitudinal study of 4,800 participants. The test costs approximately $40 per patient.",
        whyItMatters:
          'An affordable early-detection blood test could enable preventive drug interventions to begin well before irreversible neurodegeneration, fundamentally changing clinical trial design.',
        source: 'Nature',
        isBreaking: false,
      },
      {
        title: 'Antarctic Ice Sheet Losing Mass 40% Faster Than Models Predicted',
        content:
          "NASA's ICESat-2 and ESA's CryoSat-3 satellites combined data to show the West Antarctic Ice Sheet is losing 340 gigatons per year—40% above the upper bound of IPCC sixth assessment projections. The acceleration is attributed to warm Atlantic water undercutting glacier bases.",
        whyItMatters:
          'If current rates persist, sea-level rise projections for 2100 must be revised upward by 15–25 cm, redrawing flood-risk maps for 300 million coastal residents.',
        source: 'Science',
        isBreaking: false,
      },
      {
        title: 'Perseverance Rover Confirms Organic Molecules in Jezero Crater Rock Cores',
        content:
          'NASA confirmed that three rock cores drilled from the delta deposits in Jezero Crater contain complex organic molecules, including aromatic hydrocarbons consistent with ancient biological activity. The cores are sealed and await return via the Mars Sample Return mission.',
        whyItMatters:
          'While not confirmation of life, preserved organics in a site with ancient water exposure significantly raises the scientific probability that Mars once harbored microbial life.',
        source: 'NASA',
        isBreaking: false,
      },
      {
        title: 'Fermilab Muon Experiment Crosses 5-Sigma Threshold, Hinting at Fifth Fundamental Force',
        content:
          'The Muon g-2 experiment at Fermilab reached a statistical significance of 5.1 sigma for the anomalous magnetic moment of the muon, exceeding the formal threshold for a physics discovery. The result deviates from Standard Model predictions and may indicate a previously unknown particle or force.',
        whyItMatters:
          'A confirmed fifth fundamental force would be the most significant revision to particle physics since the Standard Model was formalized in the 1970s.',
        source: 'CERN',
        isBreaking: true,
      },
      {
        title: 'Gene Therapy Achieves Insulin Independence in 11 of 14 Type 1 Diabetes Patients',
        content:
          "A phase II trial published in the New England Journal of Medicine showed that a single infusion of a gene therapy vector—which reprograms liver cells to produce insulin—enabled 11 of 14 Type 1 diabetes patients to remain injection-free at the 24-month follow-up.",
        whyItMatters:
          'A durable functional cure for Type 1 diabetes would eliminate the $6,000–$15,000 annual insulin and device cost burden for approximately 8.4 million patients worldwide.',
        source: 'NEJM',
        isBreaking: false,
      },
    ],
  },
  {
    name: 'Health',
    summary: [
      'WHO declares mpox Clade Ib a global emergency',
      'New antibiotic defeats all drug-resistant strains',
      'Ultra-processed food linked to 32 conditions',
      'FDA approves first oral GLP-1 weight-loss pill',
      'Youth anxiety rates double pre-pandemic levels',
    ],
    news: [
      {
        title: 'WHO Declares New mpox Variant Clade Ib a Public Health Emergency of International Concern',
        content:
          'The World Health Organization issued its highest alert level for a new mpox variant, Clade Ib, after cases spread from the DRC to eight countries in 30 days. The variant shows higher transmissibility through respiratory routes than prior strains, with a 4.2% case fatality rate.',
        whyItMatters:
          'The PHEIC designation unlocks emergency vaccine sharing agreements and fast-tracks modified MVA-BN vaccine trials, but supply constraints mean doses will be scarce for at least six months.',
        source: 'WHO',
        isBreaking: true,
      },
      {
        title: 'New Antibiotic Compound Defeats All Known Drug-Resistant Bacterial Strains in Trial',
        content:
          "A synthetic antibiotic compound called Zosurabalpin, developed by Roche, demonstrated 100% efficacy against all 47 carbapenem-resistant Acinetobacter baumannii strains in a phase I safety trial. The compound targets a previously unexploited bacterial lipopolysaccharide transport pathway.",
        whyItMatters:
          'AMR-resistant infections are projected to kill 10 million people annually by 2050; a novel drug class effective against pan-resistant strains would be one of the most significant medical advances in decades.',
        source: 'Lancet',
        isBreaking: false,
      },
      {
        title: 'Meta-Study Links Ultra-Processed Food Consumption to 32 Distinct Health Conditions',
        content:
          'A systematic review of 45 cohort studies covering 9.9 million participants found robust associations between high ultra-processed food intake and 32 conditions including cardiovascular disease, Type 2 diabetes, anxiety, and all-cause mortality. Risk increased linearly with consumption volume.',
        whyItMatters:
          'The scale of evidence will likely force regulatory action in the EU and UK, including mandatory front-of-pack warning labels and restrictions on advertising to children.',
        source: 'BMJ',
        isBreaking: false,
      },
      {
        title: 'FDA Approves First Oral GLP-1 Pill for Weight Management, Rivaling Injectable Ozempic',
        content:
          "The FDA granted approval to Eli Lilly's orforglipron, the first once-daily pill form of a GLP-1 receptor agonist for chronic weight management. Clinical trials showed 14.7% mean body weight reduction at 36 weeks, comparable to injectable semaglutide. The pill is expected to cost significantly less than Ozempic.",
        whyItMatters:
          'An oral formulation removes the injection barrier that limits adoption, potentially expanding the addressable patient population from millions to tens of millions globally.',
        source: 'FDA',
        isBreaking: false,
      },
      {
        title: 'Youth Anxiety Rates Have Doubled Pre-Pandemic Levels, WHO Reports Across 78 Countries',
        content:
          "A WHO report covering 78 countries found that anxiety disorders in 15–24 year-olds now affect 28.6% of the demographic—more than double 2019 rates. Social media exposure, academic pressure, and climate anxiety were identified as primary drivers. Only 3% of affected individuals in low-income countries receive any treatment.",
        whyItMatters:
          'A generation entering the workforce with disproportionate mental health burdens will have compounding economic consequences, with the WHO estimating $1 trillion in lost productivity annually by 2030.',
        source: 'WHO',
        isBreaking: false,
      },
    ],
  },
]
