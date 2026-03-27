import type { Region, Credit } from '$lib/types/digest';

export interface NewsItem {
  title: string
  content: string
  whyItMatters: string
  source: string
  credits: Credit[]
  isBreaking: boolean
  isLive?: boolean
  region: Region
}

export interface Category {
  name: string
  summary: string[]
  news: NewsItem[]
}

export const mockData: Category[] = [
  {
    name: 'usa',
    summary: [
      'Fed signals rate-cut pause through mid-year',
      'OpenAI launches GPT-5 with 1M-token context',
      'SpaceX Starship completes full orbital mission',
      'FDA approves first oral GLP-1 weight-loss pill',
      'Fed Chair Powell resigns effective immediately',
    ],
    news: [
      {
        title: 'Fed Chair Powell Resigns Effective Immediately',
        content:
          'Jerome Powell submitted his resignation citing personal reasons. The White House confirmed it will name an interim chair within 48 hours. US futures dropped 1.4% on the news; the dollar weakened against major currencies in early Asian trading.',
        whyItMatters: '',
        source: 'AP',
        credits: [
          { source: 'AP', url: 'https://apnews.com/article/powell-resigns-fed-chair' },
          { source: 'WSJ', url: 'https://wsj.com/economy/central-banking/powell-resignation' },
        ],
        isBreaking: false,
        isLive: true,
        region: 'usa',
      },
      {
        title: 'Federal Reserve Signals Extended Pause on Rate Cuts Through Mid-Year',
        content:
          'Fed Chair Jerome Powell told Congress that persistent core inflation at 3.4% and a still-tight labor market mean the central bank is "in no hurry" to resume the easing cycle begun last September. Markets immediately repriced the first cut from March to July.',
        whyItMatters:
          'A longer hold keeps mortgage rates elevated, pressures commercial real estate refinancing, and delays relief for over-leveraged corporate borrowers facing wall-of-maturity deadlines.',
        source: 'WSJ',
        credits: [
          { source: 'WSJ', url: 'https://wsj.com/economy/central-banking/fed-rate-cut-pause' },
          { source: 'Bloomberg', url: 'https://bloomberg.com/news/articles/fed-powell-rate-pause' },
          { source: 'Reuters', url: 'https://reuters.com/business/finance/fed-signals-rate-cut-pause' },
        ],
        isBreaking: true,
        region: 'usa',
      },
      {
        title: 'SpaceX Starship Completes First Full Orbital Mission, Catches Both Stages',
        content:
          "Starship's ninth integrated flight test achieved full orbital velocity, deployed a payload demonstration package, and successfully caught both the Super Heavy booster and the Ship vehicle using the mechazilla tower arms at Starbase, Texas.",
        whyItMatters:
          'Full reusability of both stages is the engineering prerequisite for the cost structure that makes Mars missions and NASA Artemis lunar contracts commercially viable.',
        source: 'TechCrunch',
        credits: [
          { source: 'TechCrunch', url: 'https://techcrunch.com/2026/spacex-starship-orbital-mission' },
          { source: 'Reuters', url: 'https://reuters.com/science/spacex-starship-full-orbital-success' },
        ],
        isBreaking: false,
        region: 'usa',
      },
    ],
  },
  {
    name: 'europe',
    summary: [
      'Ukraine–Russia ceasefire talks resume in Istanbul',
      'EU emergency migration summit after 400 drown',
      'EU enforces AI Act on high-risk systems',
      'Blood test predicts Alzheimer\'s 15 years early',
      'New antibiotic defeats all drug-resistant strains',
    ],
    news: [
      {
        title: 'Ukraine and Russia Hold First Direct Ceasefire Talks in Three Years',
        content:
          'Delegations from Ukraine and Russia met in Istanbul for preliminary ceasefire negotiations, marking the first direct diplomatic contact since early 2022. The talks, brokered by Turkey and the UAE, focused on prisoner exchanges and a potential 30-day truce along the eastern front.',
        whyItMatters:
          'Even a temporary halt to hostilities could unlock humanitarian corridors and set the framework for broader peace negotiations backed by the G7.',
        source: 'Reuters',
        credits: [
          { source: 'Reuters', url: 'https://reuters.com/world/europe/ukraine-russia-ceasefire-talks-istanbul-2026' },
          { source: 'AP', url: 'https://apnews.com/article/ukraine-russia-ceasefire-istanbul' },
          { source: 'Bloomberg', url: 'https://bloomberg.com/news/articles/ukraine-russia-talks' },
        ],
        isBreaking: true,
        region: 'europe',
      },
      {
        title: 'EU Calls Emergency Summit on Migration After 400 Drown Off Libya',
        content:
          "European Union leaders convened an emergency session in Brussels after a single week saw over 400 migrants drown in the central Mediterranean. The deaths have reignited debate over the bloc's border policy ahead of scheduled elections in three member states.",
        whyItMatters:
          "The crisis is fueling far-right electoral momentum across Europe and straining the EU's Schengen framework.",
        source: 'AP',
        credits: [
          { source: 'AP', url: 'https://apnews.com/article/eu-migration-summit-libya-drownings' },
          { source: 'Reuters', url: 'https://reuters.com/world/europe/eu-emergency-migration-summit' },
        ],
        isBreaking: false,
        region: 'europe',
      },
      {
        title: 'EU Begins Enforcing AI Act High-Risk System Requirements',
        content:
          "The European Union's AI Act entered its enforcement phase for high-risk applications including medical devices, credit scoring, and biometric identification. Companies failing compliance audits face fines of up to 3% of global annual revenue.",
        whyItMatters:
          'The enforcement phase sets the first binding global legal standard for AI deployment, compelling multinationals to update model governance practices worldwide.',
        source: 'Reuters',
        credits: [
          { source: 'Reuters', url: 'https://reuters.com/technology/eu-ai-act-enforcement-begins' },
          { source: 'AP', url: 'https://apnews.com/article/eu-ai-act-high-risk-enforcement' },
        ],
        isBreaking: false,
        region: 'europe',
      },
    ],
  },
  {
    name: 'middle-east',
    summary: [
      'OPEC+ raises output by 400K barrels/day',
      'IOC confirms Saudi Arabia bid for 2036 Olympics',
      'Container shipping rates drop 38% as Red Sea normalizes',
    ],
    news: [
      {
        title: 'OPEC+ Votes to Raise Output by 400,000 Barrels Per Day Starting April',
        content:
          'The alliance agreed to its first meaningful production increase since 2022, citing stabilized demand projections and pressure from the US and EU to counter energy price inflation. Brent crude fell 4.1% on the news.',
        whyItMatters:
          'Lower oil prices feed directly into transport and manufacturing costs, providing central banks with additional room to cut rates without stoking energy-driven inflation.',
        source: 'Reuters',
        credits: [
          { source: 'Reuters', url: 'https://reuters.com/business/energy/opec-output-increase-april' },
          { source: 'Bloomberg', url: 'https://bloomberg.com/energy/opec-production-hike' },
        ],
        isBreaking: false,
        region: 'middle-east',
      },
      {
        title: 'Global Container Shipping Rates Drop 38% as Red Sea Rerouting Fades',
        content:
          'The Freightos Baltic Index fell to its lowest point in 18 months after Houthi attacks on commercial vessels ceased following a US-brokered regional ceasefire. Vessels are returning to the Suez Canal route, cutting Asia-to-Europe transit time by 10 days.',
        whyItMatters:
          'Normalized shipping rates will ease goods inflation in Europe and reduce inventory costs for manufacturers who over-ordered to buffer against transit delays.',
        source: 'Bloomberg',
        credits: [
          { source: 'Bloomberg', url: 'https://bloomberg.com/news/articles/shipping-rates-drop-red-sea' },
          { source: 'Reuters', url: 'https://reuters.com/business/shipping-rates-suez-return' },
        ],
        isBreaking: false,
        region: 'middle-east',
      },
    ],
  },
  {
    name: 'americas',
    summary: [
      'India–Pakistan border tensions escalate after airstrike',
    ],
    news: [
      {
        title: 'India Recalls Ambassador After Cross-Border Strike Kills 12 in Pakistani Kashmir',
        content:
          'India recalled its high commissioner from Islamabad following an airstrike it attributed to Pakistani forces that killed 12 civilians in the Poonch district. Pakistan denied involvement. Both nations have placed border forces on high alert.',
        whyItMatters:
          'Any sustained escalation between two nuclear-armed states would destabilize the entire South Asian region and draw immediate responses from China and the US.',
        source: 'AP',
        credits: [
          { source: 'AP', url: 'https://apnews.com/article/india-pakistan-kashmir-airstrike' },
          { source: 'Reuters', url: 'https://reuters.com/world/india/india-recalls-ambassador-pakistan' },
        ],
        isBreaking: false,
        region: 'world',
      },
    ],
  },
  {
    name: 'world',
    summary: [
      'Magnitude 7.4 earthquake strikes southern Japan',
      'China holds largest South China Sea drills since 2016',
      'UN deploys peacekeepers to Sudan after genocide ruling',
    ],
    news: [
      {
        title: 'Magnitude 7.4 Earthquake Strikes Southern Japan',
        content:
          'A 7.4-magnitude earthquake struck off the coast of Kyushu at 03:17 local time. JMA has issued a tsunami advisory for coastal prefectures. Shinkansen services on the Kagoshima line are suspended and authorities report power outages affecting 40,000 households.',
        whyItMatters: '',
        source: 'Reuters',
        credits: [
          { source: 'Reuters', url: 'https://reuters.com/world/asia-pacific/earthquake-japan-2026' },
          { source: 'AP', url: 'https://apnews.com/article/japan-earthquake-kyushu-2026' },
        ],
        isBreaking: false,
        isLive: true,
        region: 'world',
      },
      {
        title: 'China Conducts Largest Naval Drills in South China Sea Since 2016',
        content:
          'The PLA Navy launched a five-day exercise involving 40 warships and carrier-based aircraft in disputed waters near the Spratly Islands. The drills coincide with a US-Philippines joint patrol in the same corridor.',
        whyItMatters:
          'The exercise is widely read as a direct signal to Manila and Washington ahead of planned US-Philippines bilateral defense treaty talks next month.',
        source: 'Reuters',
        credits: [
          { source: 'Reuters', url: 'https://reuters.com/world/china/pla-navy-south-china-sea-drills-2026' },
          { source: 'AP', url: 'https://apnews.com/article/china-south-china-sea-naval-drills' },
        ],
        isBreaking: false,
        region: 'world',
      },
      {
        title: 'UN Security Council Votes to Deploy Peacekeepers to Sudan After Genocide Finding',
        content:
          'The UN Security Council authorized a 10,000-strong peacekeeping mission to Darfur after an independent panel concluded the RSF militia committed acts of genocide. China and Russia abstained; all other members voted in favor.',
        whyItMatters:
          "It is the Council's first unanimous genocide designation since Rwanda and sets a precedent for faster multilateral intervention in ongoing conflicts.",
        source: 'Reuters',
        credits: [
          { source: 'Reuters', url: 'https://reuters.com/world/africa/un-security-council-sudan-peacekeepers' },
          { source: 'AP', url: 'https://apnews.com/article/un-sudan-darfur-genocide-peacekeepers' },
        ],
        isBreaking: false,
        region: 'world',
      },
    ],
  },
  {
    name: 'business',
    summary: [
      'NVIDIA crosses $4T market cap',
      'Amazon acquires Deliverr for $2.1B',
    ],
    news: [
      {
        title: 'NVIDIA Becomes First Chipmaker to Surpass $4 Trillion in Market Capitalization',
        content:
          "Shares of NVIDIA rose 3.2% after the company posted quarterly revenue of $38.5 billion, beating estimates by $2.1 billion. CEO Jensen Huang announced a $50 billion share buyback program.",
        whyItMatters:
          "NVIDIA's dominance in AI training hardware is now so entrenched that its valuation is effectively a proxy for market confidence in the entire AI buildout cycle.",
        source: 'Bloomberg',
        credits: [
          { source: 'Bloomberg', url: 'https://bloomberg.com/news/articles/nvidia-4-trillion-market-cap' },
          { source: 'Reuters', url: 'https://reuters.com/technology/nvidia-crosses-4-trillion' },
        ],
        isBreaking: false,
        region: 'usa',
      },
      {
        title: 'Amazon Acquires Deliverr for $2.1 Billion to Expand Same-Day Logistics Network',
        content:
          "Amazon agreed to acquire last-mile logistics startup Deliverr, giving it proprietary same-day fulfillment infrastructure for third-party sellers who do not use FBA. The deal faces EU and UK antitrust review.",
        whyItMatters:
          "The acquisition closes the last major gap in Amazon's fulfillment stack and sharpens its competitive edge against Shopify and TikTok Shop.",
        source: 'AP',
        credits: [
          { source: 'AP', url: 'https://apnews.com/article/amazon-deliverr-acquisition' },
          { source: 'Bloomberg', url: 'https://bloomberg.com/news/articles/amazon-deliverr-deal' },
        ],
        isBreaking: false,
        region: 'usa',
      },
    ],
  },
  {
    name: 'tech',
    summary: [
      'GPT-5 launches with 1M-token context',
      'Apple foldable iPhone enters mass production',
      'Lazarus Group breaches SWIFT, steals $340M',
    ],
    news: [
      {
        title: 'OpenAI Releases GPT-5 With Native Reasoning and 1M Token Context Window',
        content:
          "OpenAI launched GPT-5 for ChatGPT Plus and API users, featuring a 1-million token context window, a built-in thinking mode for complex reasoning, and a claimed 40% reduction in hallucination rate.",
        whyItMatters:
          'A 1M-token context window enables entire codebases, legal contracts, and research corpora to be processed in a single query, fundamentally altering enterprise software workflows.',
        source: 'TechCrunch',
        credits: [
          { source: 'TechCrunch', url: 'https://techcrunch.com/2026/openai-gpt5-launch' },
          { source: 'Bloomberg', url: 'https://bloomberg.com/news/articles/openai-gpt5-release' },
        ],
        isBreaking: true,
        region: 'usa',
      },
      {
        title: 'Apple Confirms Foldable iPhone Entering Mass Production, Q4 Launch Expected',
        content:
          "Supply chain reports confirmed by Bloomberg Intelligence show Apple's first foldable iPhone—internally codenamed Clover—has entered mass production at Foxconn's Zhengzhou facility.",
        whyItMatters:
          'Apple entering the foldable segment will mainstream the form factor and pressure Samsung and Google to accelerate next-generation Galaxy and Pixel Fold updates.',
        source: 'TechCrunch',
        credits: [
          { source: 'TechCrunch', url: 'https://techcrunch.com/2026/apple-foldable-iphone-production' },
          { source: 'Bloomberg', url: 'https://bloomberg.com/news/articles/apple-foldable-iphone-clover' },
        ],
        isBreaking: false,
        region: 'world',
      },
      {
        title: 'State-Linked Hackers Breach SWIFT Network at Six Central Banks, $340M Stolen',
        content:
          "A threat actor attributed by CrowdStrike to North Korea's Lazarus Group infiltrated the SWIFT interbank messaging network at six central banks across Southeast Asia and Eastern Europe.",
        whyItMatters:
          'It is the largest successful SWIFT breach since Bangladesh Bank in 2016 and demonstrates that critical financial infrastructure remains vulnerable.',
        source: 'AP',
        credits: [
          { source: 'AP', url: 'https://apnews.com/article/swift-hack-lazarus-central-banks' },
          { source: 'Reuters', url: 'https://reuters.com/technology/swift-breach-340-million-stolen' },
        ],
        isBreaking: false,
        region: 'world',
      },
    ],
  },
  {
    name: 'science',
    summary: [
      'Antarctic ice loss 40% above projections',
      'Perseverance finds organics on Mars',
      'Muon experiment hints at fifth force',
      'Gene therapy cures Type 1 diabetes in trial',
    ],
    news: [
      {
        title: 'Antarctic Ice Sheet Losing Mass 40% Faster Than Models Predicted',
        content:
          "NASA's ICESat-2 and ESA's CryoSat-3 satellites combined data to show the West Antarctic Ice Sheet is losing 340 gigatons per year—40% above the upper bound of IPCC sixth assessment projections.",
        whyItMatters:
          'If current rates persist, sea-level rise projections for 2100 must be revised upward by 15–25 cm, redrawing flood-risk maps for 300 million coastal residents.',
        source: 'Science',
        credits: [
          { source: 'Science', url: 'https://science.org/doi/antarctic-ice-loss-2026' },
          { source: 'NASA', url: 'https://nasa.gov/science/icesat2-antarctic-findings' },
        ],
        isBreaking: false,
        region: 'world',
      },
      {
        title: 'Perseverance Rover Confirms Organic Molecules in Jezero Crater Rock Cores',
        content:
          'NASA confirmed that three rock cores drilled from the delta deposits in Jezero Crater contain complex organic molecules, including aromatic hydrocarbons consistent with ancient biological activity.',
        whyItMatters:
          'While not confirmation of life, preserved organics in a site with ancient water exposure significantly raises the scientific probability that Mars once harbored microbial life.',
        source: 'NASA',
        credits: [
          { source: 'NASA', url: 'https://nasa.gov/perseverance/jezero-organics-confirmed' },
          { source: 'Science', url: 'https://science.org/doi/mars-organic-molecules-jezero' },
        ],
        isBreaking: false,
        region: 'usa',
      },
      {
        title: 'Fermilab Muon Experiment Crosses 5-Sigma Threshold, Hinting at Fifth Fundamental Force',
        content:
          'The Muon g-2 experiment at Fermilab reached a statistical significance of 5.1 sigma for the anomalous magnetic moment of the muon, exceeding the formal threshold for a physics discovery.',
        whyItMatters:
          'A confirmed fifth fundamental force would be the most significant revision to particle physics since the Standard Model was formalized in the 1970s.',
        source: 'CERN',
        credits: [
          { source: 'CERN', url: 'https://home.cern/news/muon-g2-fifth-force-discovery' },
          { source: 'Nature', url: 'https://nature.com/articles/muon-anomaly-fifth-force' },
        ],
        isBreaking: true,
        region: 'world',
      },
    ],
  },
  {
    name: 'health',
    summary: [
      'WHO declares mpox Clade Ib a global emergency',
      'New antibiotic defeats all drug-resistant strains',
      'Ultra-processed food linked to 32 conditions',
      'Youth anxiety rates double pre-pandemic levels',
    ],
    news: [
      {
        title: 'WHO Declares New mpox Variant Clade Ib a Public Health Emergency of International Concern',
        content:
          'The World Health Organization issued its highest alert level for a new mpox variant, Clade Ib, after cases spread from the DRC to eight countries in 30 days. The variant shows higher transmissibility through respiratory routes.',
        whyItMatters:
          'The PHEIC designation unlocks emergency vaccine sharing agreements and fast-tracks modified MVA-BN vaccine trials, but supply constraints mean doses will be scarce for at least six months.',
        source: 'WHO',
        credits: [
          { source: 'WHO', url: 'https://who.int/news/mpox-clade-ib-pheic-2026' },
          { source: 'Reuters', url: 'https://reuters.com/science/who-mpox-clade-ib-emergency' },
        ],
        isBreaking: true,
        region: 'world',
      },
      {
        title: 'Meta-Study Links Ultra-Processed Food Consumption to 32 Distinct Health Conditions',
        content:
          'A systematic review of 45 cohort studies covering 9.9 million participants found robust associations between high ultra-processed food intake and 32 conditions including cardiovascular disease, Type 2 diabetes, and anxiety.',
        whyItMatters:
          'The scale of evidence will likely force regulatory action in the EU and UK, including mandatory front-of-pack warning labels and restrictions on advertising to children.',
        source: 'BMJ',
        credits: [
          { source: 'BMJ', url: 'https://bmj.com/content/ultra-processed-food-32-conditions' },
          { source: 'AP', url: 'https://apnews.com/article/ultra-processed-food-health-risks-study' },
        ],
        isBreaking: false,
        region: 'europe',
      },
      {
        title: 'Youth Anxiety Rates Have Doubled Pre-Pandemic Levels, WHO Reports Across 78 Countries',
        content:
          "A WHO report covering 78 countries found that anxiety disorders in 15–24 year-olds now affect 28.6% of the demographic—more than double 2019 rates.",
        whyItMatters:
          'A generation entering the workforce with disproportionate mental health burdens will have compounding economic consequences, with the WHO estimating $1 trillion in lost productivity annually by 2030.',
        source: 'WHO',
        credits: [
          { source: 'WHO', url: 'https://who.int/news/youth-anxiety-report-2026' },
          { source: 'AP', url: 'https://apnews.com/article/youth-anxiety-doubled-who-report' },
        ],
        isBreaking: false,
        region: 'world',
      },
    ],
  },
  {
    name: 'sports',
    summary: [
      'Champions League quarterfinal draw produces blockbuster ties',
      'India wins Cricket World Cup after 12-year drought',
      'IOC confirms Saudi Arabia bid for 2036 Olympics',
    ],
    news: [
      {
        title: 'Champions League Draw Sets Up Real Madrid vs Manchester City Rematch',
        content:
          'The UEFA Champions League quarterfinal draw produced a blockbuster rematch between Real Madrid and Manchester City. The other ties see Arsenal face Bayern Munich, Barcelona take on Inter Milan, and PSG meet Atletico Madrid.',
        whyItMatters:
          'The draw ensures the highest possible TV revenue for UEFA and sets the stage for potential dynasty-defining results for multiple clubs.',
        source: 'BBC',
        credits: [
          { source: 'BBC', url: 'https://bbc.com/sport/football/champions-league-draw-2026' },
          { source: 'Reuters', url: 'https://reuters.com/sports/champions-league-quarterfinal-draw' },
        ],
        isBreaking: false,
        region: 'europe',
      },
      {
        title: 'India Wins Cricket World Cup Final Against Australia in Record Chase',
        content:
          'India defeated Australia by 4 wickets in a thrilling World Cup final at Lord\'s, chasing down 328 with two balls to spare. Virat Kohli scored 139 not out in what he called "the greatest innings of my life."',
        whyItMatters:
          'Cricket is a $2 billion annual industry in India. A World Cup win amplifies IPL franchise valuations and consolidates BCCI dominance over global cricket governance.',
        source: 'Reuters',
        credits: [
          { source: 'Reuters', url: 'https://reuters.com/sports/cricket-world-cup-final-india-australia' },
          { source: 'AP', url: 'https://apnews.com/article/cricket-world-cup-india-wins' },
        ],
        isBreaking: true,
        region: 'world',
      },
      {
        title: 'IOC Shortlists Saudi Arabia for 2036 Summer Olympics Amid Human Rights Concerns',
        content:
          'The International Olympic Committee confirmed Saudi Arabia as the leading candidate to host the 2036 Summer Games, citing its $500 billion infrastructure investment and guaranteed funding.',
        whyItMatters:
          'A Saudi Olympics would represent the largest geopolitical use of sport as soft power since Beijing 2008, with major implications for athlete safety and press freedom.',
        source: 'AP',
        credits: [
          { source: 'AP', url: 'https://apnews.com/article/ioc-saudi-arabia-2036-olympics' },
          { source: 'Reuters', url: 'https://reuters.com/sports/olympics-saudi-arabia-2036-bid' },
        ],
        isBreaking: false,
        region: 'middle-east',
      },
    ],
  },
]
