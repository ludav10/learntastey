import { useState } from 'react';
import FranceWineMap from './FranceWineMap';

const CONTINENTS = [
  {
    id: 'europe', label: 'Europe', emoji: '🏰',
    countries: [
      {
        id: 'france', label: 'France', flag: '🇫🇷',
        regions: [
          { id: 'bordeaux', label: 'Bordeaux', grapes: 'Cabernet Sauvignon, Merlot, Cabernet Franc', style: 'Full-bodied red blends, some of the world\'s most prestigious wines. Left Bank is Cab-dominant; Right Bank (Pomerol, Saint-Émilion) is Merlot-dominant.', colour: 'Red', serve: '17–18°C', age: '5–25+ years' },
          { id: 'burgundy', label: 'Burgundy', grapes: 'Pinot Noir, Chardonnay', style: 'The benchmark for Pinot Noir and Chardonnay. Wines are classified from Village up to Grand Cru. Terroir is everything here — tiny plots produce wildly different wines.', colour: 'Red & White', serve: '13–16°C', age: '5–20 years' },
          { id: 'champagne', label: 'Champagne', grapes: 'Chardonnay, Pinot Noir, Pinot Meunier', style: 'The world\'s most famous sparkling wine, made via méthode traditionnelle. Blanc de Blancs is 100% Chardonnay; Blanc de Noirs from red grapes only.', colour: 'Sparkling', serve: '8–10°C', age: '3–15 years' },
          { id: 'rhone', label: 'Rhône Valley', grapes: 'Syrah (North), Grenache (South), Viognier', style: 'Northern Rhône: pure Syrah — Hermitage and Côte-Rôtie are icons. Southern Rhône: Grenache blends including the famous Châteauneuf-du-Pape.', colour: 'Red & White', serve: '16–18°C', age: '5–20 years' },
          { id: 'alsace', label: 'Alsace', grapes: 'Riesling, Gewürztraminer, Pinot Gris, Muscat', style: 'On the German border, Alsace labels by grape variety — unique in France. Produces intensely aromatic whites, often off-dry, with Grand Cru vineyards.', colour: 'White', serve: '10–12°C', age: '3–15 years' },
          { id: 'loire', label: 'Loire Valley', grapes: 'Sauvignon Blanc, Chenin Blanc, Cabernet Franc', style: 'France\'s longest wine region. Sancerre and Pouilly-Fumé for Sauvignon Blanc; Vouvray for Chenin Blanc; Chinon for Cabernet Franc reds.', colour: 'Red & White', serve: '10–16°C', age: '2–20 years' },
          { id: 'provence', label: 'Provence', grapes: 'Grenache, Cinsault, Mourvèdre', style: 'The world capital of dry, pale rosé. Provence rosé is pale salmon, dry, and food-friendly. Bandol produces serious reds from Mourvèdre.', colour: 'Rosé & Red', serve: '10–16°C', age: '1–8 years' },
        ],
      },
      {
        id: 'italy', label: 'Italy', flag: '🇮🇹',
        regions: [
          { id: 'piemonte', label: 'Piemonte', grapes: 'Nebbiolo, Barbera, Moscato', style: 'Home to Barolo and Barbaresco — the "King and Queen of Italian wines," both made from Nebbiolo. High tannin, high acidity, extraordinary ageing potential. Notes of tar, roses, and leather.', colour: 'Red & White', serve: '16–18°C', age: '10–30 years' },
          { id: 'tuscany', label: 'Tuscany', grapes: 'Sangiovese, Cabernet Sauvignon', style: 'Chianti is the everyday staple; Brunello di Montalcino is the prestige red. Super Tuscans (Sassicaia, Tignanello) broke the rules in the 1970s by using Cabernet and Merlot outside official appellations.', colour: 'Red', serve: '16–18°C', age: '5–20 years' },
          { id: 'veneto', label: 'Veneto', grapes: 'Garganega, Corvina, Glera', style: 'Soave (white) and Valpolicella (red) are the everyday wines; Amarone is the powerhouse — made from partially dried grapes, producing a rich, concentrated red of 15–17% alcohol.', colour: 'Red & White', serve: '13–17°C', age: '3–25 years' },
        ],
      },
      {
        id: 'spain', label: 'Spain', flag: '🇪🇸',
        regions: [
          { id: 'rioja', label: 'Rioja', grapes: 'Tempranillo, Garnacha, Graciano', style: 'Spain\'s most famous wine region. Wines are classified by oak ageing: Joven (young), Crianza (1 year oak), Reserva (1.5 years oak), Gran Reserva (2+ years oak). Vanilla and strawberry with spice.', colour: 'Red', serve: '16–18°C', age: '3–20 years' },
          { id: 'priorat', label: 'Priorat', grapes: 'Garnacha, Cariñena', style: 'One of only two Spanish DOCa regions. Old vines on steep slate (llicorella) soils produce intense, concentrated, mineral-driven reds. Among Spain\'s most expensive and collectible wines.', colour: 'Red', serve: '17–18°C', age: '5–15 years' },
          { id: 'rias-baixas', label: 'Rías Baixas', grapes: 'Albariño', style: 'In cool, Atlantic Galicia. Albariño produces crisp, aromatic whites with citrus, peach, and stone fruit. Excellent with seafood — one of Spain\'s greatest white wines.', colour: 'White', serve: '8–10°C', age: '1–5 years' },
        ],
      },
      {
        id: 'germany', label: 'Germany', flag: '🇩🇪',
        regions: [
          { id: 'mosel', label: 'Mosel', grapes: 'Riesling', style: 'Steep slate vineyards along the Mosel river. Produces Germany\'s most delicate Rieslings: low alcohol (7–9%), razor-sharp acidity, and the famous slate/petrol minerality. Ranges from bone dry to botrytis-sweet.', colour: 'White', serve: '8–10°C', age: '5–30+ years' },
          { id: 'rheingau', label: 'Rheingau', grapes: 'Riesling, Spätburgunder', style: 'The historic heart of German Riesling. South-facing slopes on the Rhine produce richer, fuller Rieslings than the Mosel. Also produces excellent Spätburgunder (Pinot Noir) in Assmannshausen.', colour: 'White & Red', serve: '10–13°C', age: '5–20 years' },
        ],
      },
      {
        id: 'portugal', label: 'Portugal', flag: '🇵🇹',
        regions: [
          { id: 'douro', label: 'Douro', grapes: 'Touriga Nacional, Touriga Franca, Tinta Roriz', style: 'Home of Port wine and increasingly world-class dry table reds. Dramatic terraced vineyards carved into steep schist. Quinta do Crasto, Niepoort, and Quinta Vale Meão lead the table wine revolution.', colour: 'Red & Fortified', serve: '16–18°C', age: '5–20 years' },
          { id: 'vinho-verde', label: 'Vinho Verde', grapes: 'Alvarinho, Loureiro, Trajadura', style: 'Light, fresh, slightly sparkling wines from northwest Portugal. "Vinho Verde" means "green wine" referring to youth, not colour. Alvarinho sub-region (Monção e Melgaço) produces the finest, most complex examples.', colour: 'White', serve: '7–9°C', age: '1–3 years' },
        ],
      },
    ],
  },
  {
    id: 'americas', label: 'Americas', emoji: '🌎',
    countries: [
      {
        id: 'argentina', label: 'Argentina', flag: '🇦🇷',
        regions: [
          {
            id: 'mendoza', label: 'Mendoza', grapes: 'Malbec, Cabernet Sauvignon, Chardonnay',
            style: 'Argentina\'s most famous wine region, sitting at 600–1,100m altitude in the Andes foothills. The altitude means cool nights preserve acidity and freshness despite intense sunshine. Luján de Cuyo and the Uco Valley are the premium sub-zones. Malbec here is inky, violet-hued, with dark plum, chocolate, and a signature velvety texture. World-class, often outstanding value.',
            colour: 'Red & White', serve: '16–18°C', age: '3–15 years',
          },
          { id: 'salta', label: 'Salta', grapes: 'Torrontés, Malbec', style: 'Some of the world\'s highest vineyards (up to 3,000m) in Cafayate Valley. Torrontés is the white star — intensely aromatic with rose, lychee, and citrus. Also produces fresh, elegant Malbec very different to Mendoza.', colour: 'White & Red', serve: '8–16°C', age: '1–8 years' },
          { id: 'patagonia', label: 'Patagonia', grapes: 'Pinot Noir, Malbec, Chardonnay', style: 'The cool southern frontier of Argentine wine. Strong Patagonian winds and low temperatures create elegant, restrained wines — Pinot Noir in particular rivals good Burgundy. San Patricio del Chañar is the main centre.', colour: 'Red & White', serve: '13–16°C', age: '3–10 years' },
        ],
      },
      {
        id: 'chile', label: 'Chile', flag: '🇨🇱',
        regions: [
          { id: 'maipo', label: 'Maipo Valley', grapes: 'Cabernet Sauvignon, Carménère', style: 'Chile\'s oldest wine region, just south of Santiago. The benchmark for Chilean Cabernet Sauvignon — structured, cassis-driven, with mint and eucalyptus notes. Concha y Toro\'s Don Melchor is among Chile\'s greatest.', colour: 'Red', serve: '16–18°C', age: '5–15 years' },
          { id: 'casablanca', label: 'Casablanca', grapes: 'Sauvignon Blanc, Chardonnay, Pinot Noir', style: 'Cool coastal valley with Pacific Ocean influence. Chile\'s leading white wine region — intense Sauvignon Blanc with tropical fruit and herbs, and elegant Chardonnay. Morning fog and afternoon breeze keep temperatures low.', colour: 'White & Red', serve: '8–13°C', age: '1–8 years' },
        ],
      },
      {
        id: 'usa', label: 'USA', flag: '🇺🇸',
        regions: [
          { id: 'napa', label: 'Napa Valley', grapes: 'Cabernet Sauvignon, Chardonnay, Merlot', style: 'America\'s most famous wine region. The 1976 Paris Tasting put Napa on the world map when Stag\'s Leap Cabernet beat Bordeaux. Today it produces some of the world\'s most expensive Cabernets — powerful, ripe, opulent. Rutherford, Oakville, and Stags Leap District are the premium AVAs.', colour: 'Red & White', serve: '16–18°C', age: '5–20 years' },
          { id: 'sonoma', label: 'Sonoma', grapes: 'Pinot Noir, Chardonnay, Zinfandel', style: 'Larger and more diverse than Napa. Russian River Valley produces exceptional cool-climate Pinot Noir and Chardonnay; Dry Creek Valley is home to old-vine Zinfandel. Generally less expensive than Napa but often just as compelling.', colour: 'Red & White', serve: '13–17°C', age: '3–15 years' },
          { id: 'willamette', label: 'Willamette Valley', grapes: 'Pinot Noir, Pinot Gris, Chardonnay', style: 'Oregon\'s premier wine region. Cool, wet climate produces elegant, Burgundian-style Pinot Noir — more savoury and restrained than California. The Dundee Hills and Chehalem Mountains AVAs are particularly prestigious.', colour: 'Red & White', serve: '13–15°C', age: '3–12 years' },
        ],
      },
    ],
  },
  {
    id: 'oceania', label: 'Oceania', emoji: '🦘',
    countries: [
      {
        id: 'australia', label: 'Australia', flag: '🇦🇺',
        regions: [
          { id: 'barossa', label: 'Barossa Valley', grapes: 'Shiraz, Grenache, Riesling', style: 'Home to some of the world\'s oldest vines — some Shiraz vines over 150 years old. Rich, powerful, full-bodied Shiraz with dark fruit, chocolate, and licorice. Penfolds Grange is Australia\'s most iconic wine, blended largely from Barossa fruit.', colour: 'Red & White', serve: '16–18°C', age: '5–30 years' },
          { id: 'margaret-river', label: 'Margaret River', grapes: 'Cabernet Sauvignon, Chardonnay, Semillon', style: 'Maritime climate on Australia\'s southwest tip. Produces refined, elegant Cabernet Sauvignon and Chardonnay with European structure. Leeuwin Estate\'s Art Series Chardonnay is among Australia\'s greatest whites.', colour: 'Red & White', serve: '13–18°C', age: '5–20 years' },
          { id: 'yarra', label: 'Yarra Valley', grapes: 'Pinot Noir, Chardonnay, Shiraz', style: 'Cool-climate region near Melbourne. Produces the most elegant Pinot Noir and Chardonnay in Australia, in a Burgundian style. Yering Station and Coldstream Hills are well-known producers.', colour: 'Red & White', serve: '13–16°C', age: '3–12 years' },
        ],
      },
      {
        id: 'nz', label: 'New Zealand', flag: '🇳🇿',
        regions: [
          { id: 'marlborough-nz', label: 'Marlborough', grapes: 'Sauvignon Blanc, Pinot Noir, Pinot Gris', style: 'The world benchmark for Sauvignon Blanc — intensely aromatic with passion fruit, gooseberry, and cut grass. Cloudy Bay put Marlborough on the map in the 1980s. Also producing excellent Pinot Noir in the Southern Valleys and Wairau Valley sub-zones.', colour: 'White & Red', serve: '8–13°C', age: '1–8 years' },
          { id: 'central-otago', label: 'Central Otago', grapes: 'Pinot Noir, Riesling', style: 'The world\'s southernmost wine region and New Zealand\'s only continental climate region. Extreme diurnal temperature range (hot days, very cold nights) produces structured, complex Pinot Noir with intense colour and fruit concentration. Burgundy is the clear inspiration.', colour: 'Red & White', serve: '13–15°C', age: '3–12 years' },
        ],
      },
    ],
  },
  {
    id: 'africa', label: 'South Africa', emoji: '🦁',
    countries: [
      {
        id: 'sa', label: 'South Africa', flag: '🇿🇦',
        regions: [
          { id: 'stellenbosch', label: 'Stellenbosch', grapes: 'Cabernet Sauvignon, Syrah, Chenin Blanc', style: 'The heart of South African fine wine. Mountain-influenced terroir with granite and clay soils. Produces structured Cabernet Sauvignon and Bordeaux blends, as well as excellent Syrah. Warwick, Meerlust, and Kanonkop are iconic estates.', colour: 'Red & White', serve: '15–18°C', age: '5–15 years' },
          { id: 'swartland', label: 'Swartland', grapes: 'Chenin Blanc, Syrah, Grenache', style: 'The frontier of South African wine — old bush vines on schist and granite. Eben Sadie and Mullineux lead the way with complex, textured Chenin Blanc and Rhône-style blends. Natural wine-friendly with minimal intervention.', colour: 'Red & White', serve: '13–17°C', age: '3–12 years' },
        ],
      },
    ],
  },
];

export default function Explore() {
  const [continent, setContinent] = useState(null);
  const [country, setCountry] = useState(null);
  const [region, setRegion] = useState(null);

  const continentData = CONTINENTS.find(c => c.id === continent);
  const countryData = continentData?.countries.find(c => c.id === country);
  const regionData = countryData?.regions.find(r => r.id === region);

  function reset() { setContinent(null); setCountry(null); setRegion(null); }
  function goContinent(id) { setContinent(id); setCountry(null); setRegion(null); }
  function goCountry(id) { setCountry(id); setRegion(null); }

  return (
    <div className="page explore-page">

      {/* Breadcrumb */}
      <div className="explore-crumb">
        <button className={`crumb-btn ${!continent ? 'active' : ''}`} onClick={reset}>🌍 World</button>
        {continent && <>
          <span className="crumb-sep"> › </span>
          <button className={`crumb-btn ${continent && !country ? 'active' : ''}`} onClick={() => { setCountry(null); setRegion(null); }}>
            {continentData?.emoji} {continentData?.label}
          </button>
        </>}
        {country && <>
          <span className="crumb-sep"> › </span>
          <button className={`crumb-btn ${country && !region ? 'active' : ''}`} onClick={() => setRegion(null)}>
            {countryData?.flag} {countryData?.label}
          </button>
        </>}
        {region && <>
          <span className="crumb-sep"> › </span>
          <span className="crumb-btn active">{regionData?.label}</span>
        </>}
      </div>

      {/* World — continents */}
      {!continent && (
        <>
          <h1 className="page-title" style={{ marginBottom: 16 }}>Explore Wine World</h1>
          <div className="explore-grid continents">
            {CONTINENTS.map(c => (
              <div key={c.id} className="explore-card continent-card" onClick={() => goContinent(c.id)}>
                <div className="explore-card-emoji">{c.emoji}</div>
                <div className="explore-card-label">{c.label}</div>
                <div className="explore-card-sub">{c.countries.length} countries</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Continent — countries */}
      {continent && !country && (
        <>
          <h1 className="page-title" style={{ marginBottom: 16 }}>{continentData?.emoji} {continentData?.label}</h1>
          <div className="explore-grid countries">
            {continentData?.countries.map(c => (
              <div key={c.id} className="explore-card country-card" onClick={() => goCountry(c.id)}>
                <div className="explore-card-emoji">{c.flag}</div>
                <div className="explore-card-label">{c.label}</div>
                <div className="explore-card-sub">{c.regions.length} regions</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Country — regions (or interactive map for France) */}
      {country && !region && (
        <>
          <h1 className="page-title" style={{ marginBottom: country === 'france' ? 12 : 4 }}>
            {countryData?.flag} {countryData?.label}
          </h1>
          {country === 'france' ? (
            <FranceWineMap />
          ) : (
            <>
              <p style={{ color: 'var(--text-mute)', fontSize: 13, marginBottom: 18 }}>Select a region to learn more</p>
              <div className="explore-grid regions">
                {countryData?.regions.map(r => (
                  <div key={r.id} className="explore-card region-card" onClick={() => setRegion(r.id)}>
                    <div className="explore-card-label">{r.label}</div>
                    <div className="explore-region-grapes">{r.grapes}</div>
                    <div className={`explore-colour-tag colour-${r.colour.split(' ')[0].toLowerCase()}`}>{r.colour}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Region info */}
      {region && regionData && (
        <div className="region-detail">
          <div className="region-detail-header">
            <div>
              <div className="region-detail-title">{regionData.label}</div>
              <div className="region-detail-country">{countryData?.flag} {countryData?.label}</div>
            </div>
            <div className={`explore-colour-tag colour-${regionData.colour.split(' ')[0].toLowerCase()} large`}>
              {regionData.colour}
            </div>
          </div>

          <div className="region-detail-body">{regionData.style}</div>

          <div className="region-detail-facts">
            <div className="region-fact">
              <div className="region-fact-label">Grapes</div>
              <div className="region-fact-value">{regionData.grapes}</div>
            </div>
            <div className="region-fact">
              <div className="region-fact-label">Serve at</div>
              <div className="region-fact-value">{regionData.serve}</div>
            </div>
            <div className="region-fact">
              <div className="region-fact-label">Age</div>
              <div className="region-fact-value">{regionData.age}</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
