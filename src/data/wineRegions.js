// Grape varieties
export const WINE_GRAPES = [
  'Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah', 'Shiraz', 'Malbec',
  'Grenache', 'Tempranillo', 'Sangiovese', 'Nebbiolo', 'Barbera', 'Dolcetto',
  'Zinfandel', 'Primitivo', 'Mourvèdre', 'Cabernet Franc', 'Petit Verdot',
  'Carménère', 'Gamay', 'Pinotage', 'Montepulciano', "Nero d'Avola",
  'Aglianico', 'Corvina', 'Rondinella', 'Sagrantino', 'Touriga Nacional',
  'Touriga Franca', 'Tinta Roriz', 'Xinomavro', 'Agiorgitiko',
  'Chardonnay', 'Sauvignon Blanc', 'Riesling', 'Pinot Grigio', 'Pinot Gris',
  'Gewürztraminer', 'Viognier', 'Chenin Blanc', 'Semillon', 'Muscat',
  'Albariño', 'Grüner Veltliner', 'Torrontés', 'Vermentino', 'Fiano',
  'Greco di Tufo', 'Falanghina', 'Garganega', 'Trebbiano',
  'Marsanne', 'Roussanne', 'Pinot Blanc', 'Aligoté', 'Verdejo', 'Godello',
  'Palomino', 'Pinot Meunier', 'Glera', 'Macabeo', 'Xarello',
];

// Countries
export const WINE_COUNTRIES = [
  'France', 'Italy', 'Spain', 'Germany', 'Portugal', 'Austria', 'Switzerland',
  'USA', 'Australia', 'New Zealand', 'Argentina', 'Chile', 'South Africa',
  'Hungary', 'Greece', 'Croatia', 'Slovenia', 'Romania', 'Bulgaria',
  'Georgia', 'Lebanon', 'Israel', 'Japan', 'Canada', 'Uruguay',
  'Brazil', 'England', 'Luxembourg', 'Czech Republic', 'Moldova',
];

// Regions by country — used to filter suggestions based on selected country
export const REGIONS_BY_COUNTRY = {
  France: [
    'Bordeaux', 'Burgundy', 'Champagne', 'Rhône', 'Alsace', 'Loire Valley',
    'Provence', 'Languedoc', 'Roussillon', 'Beaujolais', 'Jura', 'Savoie',
    'Sancerre', 'Pouilly-Fumé', 'Muscadet', 'Vouvray', 'Chinon', 'Cahors',
    'Pomerol', 'Saint-Émilion', 'Pauillac', 'Margaux', 'Saint-Julien',
    'Gevrey-Chambertin', 'Meursault', 'Chablis', 'Côte de Nuits', 'Côte de Beaune',
    'Mâconnais', 'Hermitage', 'Côte-Rôtie', 'Condrieu', 'Châteauneuf-du-Pape', 'Gigondas',
  ],
  Italy: [
    'Piemonte', 'Tuscany', 'Veneto', 'Sicily', 'Sardinia', 'Friuli',
    'Barolo', 'Barbaresco', 'Chianti', 'Chianti Classico', 'Brunello di Montalcino',
    'Vino Nobile di Montepulciano', 'Amarone', 'Soave', 'Prosecco',
    'Bolgheri', "Montepulciano d'Abruzzo", 'Alto Adige', 'Trentino', 'Langhe',
    'Umbria', 'Lazio', 'Campania', 'Puglia', 'Calabria',
  ],
  Spain: [
    'Rioja', 'Ribera del Duero', 'Priorat', 'Rías Baixas', 'Jerez',
    'Penedès', 'Cava', 'Bierzo', 'Toro', 'Rueda', 'Jumilla', 'Yecla',
    'Galicia', 'Catalonia', 'Castilla y León', 'La Mancha', 'Navarra',
  ],
  Germany: [
    'Mosel', 'Rheingau', 'Rheinhessen', 'Pfalz', 'Baden', 'Franken',
    'Nahe', 'Mittelrhein', 'Ahr', 'Württemberg', 'Sachsen',
  ],
  Portugal: [
    'Douro', 'Vinho Verde', 'Alentejo', 'Dão', 'Bairrada', 'Madeira',
    'Port', 'Setúbal', 'Tejo', 'Lisboa', 'Algarve',
  ],
  Austria: [
    'Wachau', 'Kremstal', 'Kamptal', 'Burgenland', 'Vienna',
    'Steiermark', 'Neusiedlersee', 'Weinviertel',
  ],
  USA: [
    'Napa Valley', 'Sonoma', 'Willamette Valley', 'Columbia Valley',
    'Santa Barbara', 'Paso Robles', 'Mendocino', 'Russian River Valley',
    'Stags Leap', 'Rutherford', 'Oakville', 'Alexander Valley',
    'Finger Lakes', 'Walla Walla',
  ],
  Australia: [
    'Barossa Valley', 'McLaren Vale', 'Margaret River', 'Hunter Valley',
    'Coonawarra', 'Yarra Valley', 'Clare Valley', 'Eden Valley',
    'Heathcote', 'Mornington Peninsula', 'Langhorne Creek', 'Padthaway',
  ],
  'New Zealand': [
    'Marlborough', 'Central Otago', "Hawke's Bay", 'Martinborough',
    'Gisborne', 'Nelson', 'Waiheke Island', 'Canterbury',
  ],
  Argentina: [
    'Mendoza', 'Luján de Cuyo', 'Maipú', 'Salta', 'Patagonia',
    'Uco Valley', 'San Juan', 'La Rioja', 'Neuquén',
  ],
  Chile: [
    'Maipo Valley', 'Casablanca', 'Colchagua', 'Aconcagua', 'Leyda',
    'Elqui', 'Limarí', 'Bío Bío', 'San Antonio', 'Cachapoal',
  ],
  'South Africa': [
    'Stellenbosch', 'Paarl', 'Franschhoek', 'Constantia', 'Swartland',
    'Elgin', 'Walker Bay', 'Robertson', 'Darling',
  ],
  Hungary: ['Tokaj', 'Eger', 'Villány', 'Somló', 'Badacsony'],
  Greece: ['Santorini', 'Naoussa', 'Nemea', 'Crete', 'Kefalonia', 'Rhodes'],
  Croatia: ['Dalmatia', 'Istria', 'Slavonia'],
  Georgia: ['Kakheti', 'Kartli', 'Imereti', 'Racha'],
  Lebanon: ['Bekaa Valley'],
  England: ['Sussex', 'Kent', 'Hampshire'],
};

// Flat list for when no country is selected
export const WINE_REGIONS = Object.values(REGIONS_BY_COUNTRY).flat();

// Returns regions for a given country (case-insensitive), falls back to all regions
export function getRegionsForCountry(country) {
  if (!country) return WINE_REGIONS;
  const key = Object.keys(REGIONS_BY_COUNTRY).find(
    k => k.toLowerCase() === country.toLowerCase()
  );
  return key ? REGIONS_BY_COUNTRY[key] : WINE_REGIONS;
}
