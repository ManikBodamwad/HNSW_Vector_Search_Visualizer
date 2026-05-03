"""
Generate production-quality node embeddings using sentence-transformers.
Outputs nodes.json, edges.json, queries.json to frontend/src/data/

Run once:
    pip install -r requirements.txt
    python generate_dataset.py

The frontend uses its own synthetic data by default.
Replace frontend/src/data/graphData.js imports with the JSON outputs
from this script for production-quality semantic embeddings.
"""
import json, numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer
from sklearn.decomposition import PCA
import hnswlib

OUT = Path(__file__).parent.parent / "frontend/src/data"
OUT.mkdir(parents=True, exist_ok=True)

SENTENCES = [
    # Machine Learning (0-29)
    "gradient descent optimization neural networks",
    "overfitting prevention regularization techniques",
    "convolutional neural network image recognition",
    "transformer architecture self-attention mechanism",
    "reinforcement learning reward policy gradient",
    "support vector machine kernel classification",
    "random forest ensemble decision trees bagging",
    "hyperparameter tuning cross-validation grid search",
    "batch normalization deep learning layer training",
    "dropout regularization overfitting prevention",
    "recurrent neural network LSTM sequence modeling",
    "generative adversarial network image synthesis",
    "backpropagation gradient chain rule computation",
    "word embedding vector semantic representation",
    "transfer learning pretrained model fine-tuning",
    "autoencoder latent space representation learning",
    "k-means clustering unsupervised centroid algorithm",
    "principal component analysis dimensionality reduction",
    "logistic regression sigmoid binary classification",
    "natural language processing text tokenization",
    "computer vision object detection bounding boxes",
    "activation function relu sigmoid gelu nonlinear",
    "cross-entropy loss function softmax training",
    "multi-head attention transformer architecture",
    "data augmentation image preprocessing training",
    "neural architecture search automated ml pipeline",
    "feature engineering selection machine learning",
    "SHAP LIME model explainability interpretability",
    "stochastic gradient descent mini-batch optimizer",
    "knowledge distillation model compression inference",
    # Finance (30-59)
    "stock market volatility index VIX calculation",
    "compound interest investment return formula",
    "portfolio diversification risk management strategy",
    "central bank monetary policy interest rates",
    "cryptocurrency blockchain consensus proof-of-work",
    "options pricing Black-Scholes model derivatives",
    "inflation CPI consumer price index economics",
    "hedge fund quantitative trading alpha strategy",
    "market capitalization equity valuation P/E ratio",
    "bond yield treasury securities fixed income",
    "venture capital startup funding Series A round",
    "foreign exchange forex currency pair trading",
    "dividend reinvestment compound growth strategy",
    "IPO initial public offering stock market listing",
    "algorithmic trading high-frequency market maker",
    "credit default swap mortgage-backed securities",
    "GDP gross domestic product economic growth",
    "supply demand equilibrium microeconomics",
    "private equity leveraged buyout acquisition",
    "quantitative easing monetary stimulus Fed",
    "return on equity ROE financial ratio analysis",
    "arbitrage risk-free profit market inefficiency",
    "technical analysis candlestick chart pattern",
    "commodity futures oil gold silver trading",
    "ESG environmental social governance investing",
    "capital gains tax loss harvesting optimization",
    "recession yield curve inversion indicator signal",
    "market liquidity bid-ask spread trading volume",
    "discounted cash flow DCF financial modeling",
    "DeFi decentralized finance yield farming protocol",
    # Space (60-89)
    "black hole event horizon gravitational singularity",
    "Mars rover geological survey planetary science",
    "stellar nucleosynthesis heavy element formation",
    "gravitational wave detection LIGO interferometer",
    "exoplanet atmospheric spectroscopy habitable zone",
    "dark matter galactic rotation curve evidence",
    "NASA Artemis lunar mission moon surface landing",
    "James Webb telescope infrared galaxy observation",
    "neutron star pulsar magnetic field radio emission",
    "cosmic microwave background big bang radiation",
    "solar flare coronal mass ejection space weather",
    "Hubble constant universe expansion measurement",
    "asteroid mining space resource extraction future",
    "SpaceX Starship reusable rocket propulsion system",
    "Jupiter Great Red Spot atmospheric storm dynamics",
    "Saturn rings ice particle composition structure",
    "supernova remnant stellar explosion energy release",
    "radio telescope SETI signal detection search",
    "orbital mechanics Kepler laws planetary motion",
    "dark energy vacuum energy accelerated expansion",
    "galaxy cluster gravitational lensing dark matter",
    "space debris low earth orbit collision avoidance",
    "Voyager probe interstellar space heliopause",
    "tidal force gravitational interaction ocean moon",
    "binary star system orbital period dynamics",
    "cosmic ray high-energy particle atmosphere impact",
    "adaptive optics telescope atmospheric distortion",
    "protoplanetary disk accretion planet formation",
    "kilonova neutron star merger gold element synthesis",
    "aurora borealis solar wind magnetic field interaction",
    # Biology (90-119)
    "CRISPR gene editing therapeutic applications",
    "mitochondrial DNA maternal inheritance genetics",
    "protein folding AlphaFold structure prediction",
    "synaptic plasticity neural connection learning",
    "gut microbiome immune system interaction",
    "mRNA vaccine immunology cellular immune response",
    "phospholipid bilayer cell membrane transport",
    "photosynthesis chloroplast light reaction ATP",
    "enzyme catalysis substrate active site binding",
    "cancer immunotherapy checkpoint inhibitor treatment",
    "blood-brain barrier drug delivery neurology",
    "stem cell differentiation tissue regeneration",
    "antibiotic resistance bacterial mutation evolution",
    "epigenetic DNA methylation gene expression",
    "cardiovascular risk factor prevention heart disease",
    "COVID spike protein ACE2 receptor binding",
    "Alzheimer amyloid plaque tau neurodegeneration",
    "organ transplant immunosuppression rejection",
    "randomized controlled trial placebo clinical study",
    "DNA replication polymerase proofreading fidelity",
    "endocrine hormonal regulation feedback loop",
    "cytokine inflammation immune cascade signaling",
    "Mendelian inheritance dominant recessive genetics",
    "ecosystem biodiversity species conservation",
    "pharmacokinetics drug liver metabolism clearance",
    "robotic surgery minimally invasive laparoscopy",
    "16S rRNA microbiome gut bacteria sequencing",
    "telomere aging cell senescence chromosome",
    "insulin resistance metabolic syndrome obesity",
    "PCR diagnostic pathogen detection laboratory",
    # Programming (120-149)
    "distributed consensus Raft Paxos algorithm system",
    "binary search tree AVL rotation balancing",
    "dynamic programming memoization overlapping subproblems",
    "Docker container orchestration Kubernetes deployment",
    "REST API HTTP endpoint request response JSON",
    "graph traversal BFS DFS topological sort",
    "garbage collection heap memory management runtime",
    "SQL query optimization index database join",
    "RSA public key cryptography digital signature",
    "microservices architecture service mesh latency",
    "React component virtual DOM reconciliation",
    "Python async generator decorator coroutine",
    "process thread scheduler preemption operating system",
    "compiler lexer parser abstract syntax tree",
    "TCP UDP socket network protocol connection",
    "Git branch merge rebase version control",
    "hash table collision chaining open addressing",
    "WebSocket real-time bidirectional communication",
    "CI/CD pipeline GitHub Actions deployment automation",
    "Redis cache eviction TTL in-memory key-value",
    "Rust ownership borrow checker memory safety",
    "GraphQL schema resolver mutation subscription",
    "time complexity Big O space tradeoff analysis",
    "SOLID principles design pattern refactoring",
    "load balancer reverse proxy nginx traffic routing",
    "WebAssembly binary format browser performance",
    "event loop non-blocking I/O Node.js concurrency",
    "vector database embedding similarity search index",
    "LLM prompt engineering few-shot chain-of-thought",
    "OAuth JWT authentication authorization token",
    # History (150-179)
    "Roman Empire expansion military legions conquest",
    "World War II Pacific theater naval strategy",
    "French Revolution guillotine monarchy overthrow",
    "Cold War nuclear arms race Soviet Union",
    "Silk Road trade route cultural exchange ancient",
    "Byzantine Empire Constantinople medieval fall",
    "American Civil War slavery emancipation proclamation",
    "Renaissance humanism art scientific revolution",
    "Mongol Empire Genghis Khan conquest expansion",
    "Industrial Revolution steam engine factory labor",
    "Cuban Missile Crisis nuclear standoff Kennedy",
    "Ottoman Empire decline Balkan nationalism",
    "Great Depression economic collapse banking crisis",
    "Berlin Wall fall German reunification Cold War end",
    "Magna Carta feudal rights constitutional monarchy",
    "Vietnam War guerrilla tactics protest movement",
    "Egyptian pharaoh pyramid burial ritual afterlife",
    "Greek democracy philosophy Socrates Plato Athens",
    "Brexit European Union referendum sovereignty",
    "Korean War armistice demilitarized zone division",
    "colonial independence decolonization African nations",
    "Watergate scandal presidential impeachment Nixon",
    "Spanish Inquisition religious persecution heresy",
    "climate treaty Paris Agreement carbon emissions",
    "propaganda media censorship authoritarian regime",
    "feudal system serfdom medieval European agriculture",
    "Crusades holy land Christian Muslim conflict",
    "Weimar Republic hyperinflation German democracy",
    "apartheid South Africa racial segregation Mandela",
    "League of Nations international diplomacy failure",
    # Music (180-209)
    "jazz improvisation bebop syncopation rhythm blues",
    "Renaissance oil painting chiaroscuro technique",
    "symphony orchestra conductor Beethoven symphony",
    "hip-hop sampling breakbeat electronic production",
    "impressionist painting Monet light color brushwork",
    "film noir cinematography shadow contrast lighting",
    "guitar chord progression blues rock pentatonic",
    "ballet choreography pointe arabesque pirouette",
    "digital art NFT generative algorithm creative",
    "music theory harmony counterpoint chord tension",
    "abstract expressionism Jackson Pollock drip painting",
    "opera aria libretto soprano tenor performance",
    "electronic music synthesizer oscillator waveform",
    "street photography candid documentary urban life",
    "sculpture marble bronze casting technique art",
    "film score Hans Zimmer orchestral soundtrack",
    "pop music chord production verse chorus bridge",
    "cubism Picasso geometric perspective fragmentation",
    "vinyl record analog warmth audiophile listening",
    "typography kerning serif sans-serif design",
    "graphic novel comic panel storytelling sequential",
    "woodblock print ukiyo-e Japanese traditional art",
    "punk rock rebellion DIY ethos three-chord energy",
    "dance rhythm movement expression contemporary",
    "museum curation exhibition art historical context",
    "photography aperture shutter exposure composition",
    "streaming platform algorithm music recommendation",
    "drum kit polyrhythm groove pocket swing feel",
    "watercolor wash technique layering pigment",
    "musical theater Broadway production staging cast",
    # Sports (210-239)
    "marathon training periodization endurance running",
    "Olympic weightlifting snatch clean jerk technique",
    "basketball pick-and-roll offensive strategy NBA",
    "soccer pressing tactic high defensive block",
    "swimming stroke freestyle butterfly technique",
    "cricket batting technique cover drive",
    "protein synthesis muscle hypertrophy recovery",
    "VO2 max aerobic capacity cardiovascular fitness",
    "tennis serve topspin backhand footwork positioning",
    "yoga flexibility mindfulness breath control",
    "American football blitz coverage zone defense",
    "cycling power output watt training threshold",
    "CrossFit AMRAP WOD functional fitness circuit",
    "nutrition macronutrient caloric deficit fat loss",
    "rugby scrum lineout set piece strategy",
    "sprint biomechanics stride length frequency",
    "gymnastics vault release bar routine scoring",
    "ice hockey power play penalty kill face-off",
    "golf swing biomechanics club selection course",
    "combat sport grappling submission BJJ technique",
    "high-intensity interval training HIIT fat burn",
    "recovery sleep hydration periodization athlete",
    "sports psychology mental toughness focus pressure",
    "track field pole vault high jump biomechanics",
    "badminton smash drop shot net kill rally",
    "Formula 1 aerodynamics downforce pit strategy",
    "surfing wave reading barrel tube riding stance",
    "boxing jab cross hook combination footwork",
    "rock climbing route bouldering grip technique",
    "team cohesion locker room leadership culture",
    # Food (240-269)
    "Maillard reaction browning caramelization flavor",
    "sourdough fermentation wild yeast gluten structure",
    "sous vide precise temperature water bath cooking",
    "umami fifth taste glutamate savory flavor",
    "sushi rice vinegar fish technique Japanese cuisine",
    "French sauce mother béchamel velouté espagnole",
    "pasta al dente gluten network semolina dough",
    "spice blend cumin coriander turmeric masala",
    "fermentation kimchi sauerkraut probiotic bacteria",
    "baking bread yeast proofing gluten development",
    "chocolate tempering cacao butter crystal cocoa",
    "wine pairing tannin acidity body varietal terroir",
    "molecular gastronomy spherification foam texture",
    "knife skills julienne brunoise mise en place",
    "braising collagen gelatin slow cook rich sauce",
    "street food vendor taco noodle regional specialty",
    "food safety HACCP temperature pathogen prevention",
    "emulsification mayonnaise lecithin fat water",
    "regional Italian cuisine pasta sauce tradition",
    "cocktail mixology bitters balance citrus spirit",
    "vegetarian umami depth mushroom nutritional yeast",
    "dim sum steaming dumpling Cantonese tradition",
    "BBQ smoke ring bark low slow temperature wood",
    "ice cream gelato emulsifier stabilizer churning",
    "food photography styling composition lighting",
    "plant-based protein texture meat alternative",
    "pickling brine acid preservation vegetable",
    "coffee extraction espresso grind bloom ratio",
    "cake layering ganache buttercream decoration",
    "restaurant menu costing labor food percentage",
    # Philosophy (270-299)
    "existentialism Sartre freedom authenticity being",
    "cognitive bias heuristic anchoring confirmation",
    "stoicism Marcus Aurelius virtue dichotomy control",
    "consciousness hard problem qualia subjective experience",
    "Maslow hierarchy needs motivation self-actualization",
    "Kantian ethics categorical imperative duty morality",
    "behavioral psychology operant classical conditioning",
    "epistemology knowledge justification belief truth",
    "attachment theory Bowlby infant caregiver bond",
    "Nietzsche will to power eternal recurrence nihilism",
    "cognitive dissonance belief attitude rationalization",
    "utilitarian ethics greatest good consequentialism",
    "social contract Rousseau Locke political philosophy",
    "Jungian archetype collective unconscious shadow",
    "free will determinism compatibilism debate",
    "positive psychology flow optimal experience",
    "phenomenology Husserl intentionality lived experience",
    "trauma PTSD memory consolidation therapy treatment",
    "game theory Nash equilibrium prisoner dilemma",
    "mindfulness meditation present awareness neuroscience",
    "Plato allegory cave shadow reality ideal forms",
    "growth mindset intelligence malleability Carol Dweck",
    "philosophy of science falsifiability Popper paradigm",
    "emotional intelligence empathy self-regulation",
    "confirmation bias echo chamber belief polarization",
    "Marxist dialectical materialism class struggle",
    "decision theory expected utility rational choice",
    "mirror neuron empathy imitation social cognition",
    "language Wittgenstein meaning use family resemblance",
    "psychoanalysis Freud unconscious repression dream",
]

CLUSTER_NAMES = [
    "Machine Learning", "Finance", "Space & Astronomy", "Biology & Medicine",
    "Programming & CS", "History & Politics", "Music & Arts",
    "Sports & Fitness", "Food & Cooking", "Philosophy & Psychology"
]

CLUSTER_CENTERS = [
    (180,140),(800,150),(490,85),(110,490),(880,390),
    (270,700),(610,700),(880,640),(680,290),(460,460)
]

print(f"Encoding {len(SENTENCES)} sentences...")
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
embeddings = model.encode(SENTENCES, show_progress_bar=True, normalize_embeddings=True)

print("Reducing to 2D with PCA...")
pca = PCA(n_components=2)
coords = pca.fit_transform(embeddings)

# Normalize within cluster spatial bounds
nodes_out = []
for i, (text, emb, coord) in enumerate(zip(SENTENCES, embeddings, coords)):
    cluster = i // 30
    cx, cy = CLUSTER_CENTERS[cluster]
    # Scale PCA coord to canvas space centered on cluster
    x = float(np.clip(cx + coord[0] * 120, 40, 960))
    y = float(np.clip(cy + coord[1] * 120, 40, 760))
    nodes_out.append({
        "id": i,
        "text": text,
        "cluster": cluster,
        "clusterName": CLUSTER_NAMES[cluster],
        "x": round(x, 1),
        "y": round(y, 1),
        "embedding": emb.tolist()
    })

print("Building HNSW index for edges...")
dim = embeddings.shape[1]
index = hnswlib.Index(space='cosine', dim=dim)
index.init_index(max_elements=len(SENTENCES), ef_construction=200, M=16)
index.add_items(embeddings, list(range(len(SENTENCES))))
index.set_ef(50)

edges_out = []
for i in range(len(SENTENCES)):
    labels, dists = index.knn_query(embeddings[i:i+1], k=7)
    for j, d in zip(labels[0][1:], dists[0][1:]):
        sim = float(1 - d)
        if i < int(j) and sim > 0.3:
            edges_out.append({"from": i, "to": int(j), "sim": round(sim, 3)})

with open(OUT / "nodes.json", "w") as f:
    json.dump(nodes_out, f)
print(f"✓ Saved {len(nodes_out)} nodes → {OUT}/nodes.json")

with open(OUT / "edges.json", "w") as f:
    json.dump(edges_out, f)
print(f"✓ Saved {len(edges_out)} edges → {OUT}/edges.json")

print("\nDone! Replace graphData.js imports with the JSON files.")
