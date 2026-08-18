export type CatalogCocktail={name:string;description:string;ingredients:{ingredient:string;amount_ml:number}[]}

export const COCKTAIL_CATALOG:CatalogCocktail[]=[
{name:'Long Island Iced Tea',description:'Vodka, gin, rom, tequila, triple sec, sitrus og cola.',ingredients:[{ingredient:'Vodka',amount_ml:15},{ingredient:'Gin',amount_ml:15},{ingredient:'White rum',amount_ml:15},{ingredient:'Tequila',amount_ml:15},{ingredient:'Triple sec',amount_ml:15},{ingredient:'Lemon juice',amount_ml:25},{ingredient:'Sugar syrup',amount_ml:15},{ingredient:'Cola',amount_ml:60}]},
{name:'Mojito',description:'Rom, lime, mynte, sukker og soda.',ingredients:[{ingredient:'White rum',amount_ml:50},{ingredient:'Lime juice',amount_ml:25},{ingredient:'Sugar syrup',amount_ml:15},{ingredient:'Mint',amount_ml:10},{ingredient:'Soda water',amount_ml:60}]},
{name:'Daiquiri',description:'Klassisk romdrink med lime og sukker.',ingredients:[{ingredient:'White rum',amount_ml:60},{ingredient:'Lime juice',amount_ml:30},{ingredient:'Sugar syrup',amount_ml:20}]},
{name:'Tom Collins',description:'Gin, sitron, sukker og soda.',ingredients:[{ingredient:'Gin',amount_ml:50},{ingredient:'Lemon juice',amount_ml:25},{ingredient:'Sugar syrup',amount_ml:15},{ingredient:'Soda water',amount_ml:60}]},
{name:'Gin & Tonic',description:'Gin og tonic. Menneskeheten overlevde på enklere ting.',ingredients:[{ingredient:'Gin',amount_ml:50},{ingredient:'Tonic water',amount_ml:120}]},
{name:'Margarita',description:'Tequila, appelsinlikør og lime.',ingredients:[{ingredient:'Tequila',amount_ml:50},{ingredient:'Triple sec',amount_ml:25},{ingredient:'Lime juice',amount_ml:25}]},
{name:'Espresso Martini',description:'Vodka, kaffelikør og espresso.',ingredients:[{ingredient:'Vodka',amount_ml:40},{ingredient:'Kahlúa',amount_ml:20},{ingredient:'Espresso',amount_ml:30},{ingredient:'Sugar syrup',amount_ml:10}]},
{name:'Whiskey Sour',description:'Whiskey, sitron og sukker.',ingredients:[{ingredient:'Whiskey',amount_ml:60},{ingredient:'Lemon juice',amount_ml:30},{ingredient:'Sugar syrup',amount_ml:20}]},
{name:'Old Fashioned',description:'Whiskey, sukker og bitters.',ingredients:[{ingredient:'Whiskey',amount_ml:60},{ingredient:'Sugar syrup',amount_ml:10},{ingredient:'Angostura bitters',amount_ml:2}]},
{name:'Negroni',description:'Gin, Campari og søt vermut.',ingredients:[{ingredient:'Gin',amount_ml:30},{ingredient:'Campari',amount_ml:30},{ingredient:'Vermouth sweet',amount_ml:30}]},
{name:'Aperol Spritz',description:'Aperol, prosecco og soda.',ingredients:[{ingredient:'Aperol',amount_ml:60},{ingredient:'Prosecco',amount_ml:90},{ingredient:'Soda water',amount_ml:30}]},
{name:'Moscow Mule',description:'Vodka, lime og ginger beer.',ingredients:[{ingredient:'Vodka',amount_ml:50},{ingredient:'Lime juice',amount_ml:20},{ingredient:'Ginger beer',amount_ml:120}]},
{name:'Cuba Libre',description:'Rom, cola og lime.',ingredients:[{ingredient:'White rum',amount_ml:50},{ingredient:'Cola',amount_ml:120},{ingredient:'Lime juice',amount_ml:15}]},
{name:'Tequila Sunrise',description:'Tequila, appelsin og grenadine.',ingredients:[{ingredient:'Tequila',amount_ml:50},{ingredient:'Orange juice',amount_ml:100},{ingredient:'Grenadine',amount_ml:15}]},
{name:'Piña Colada',description:'Rom, ananas og kokos.',ingredients:[{ingredient:'White rum',amount_ml:50},{ingredient:'Pineapple juice',amount_ml:90},{ingredient:'Coconut cream',amount_ml:30}]},
{name:'Sex on the Beach',description:'Vodka, ferskenlikør, appelsin og tranebær.',ingredients:[{ingredient:'Vodka',amount_ml:40},{ingredient:'Peach schnapps',amount_ml:20},{ingredient:'Orange juice',amount_ml:50},{ingredient:'Cranberry juice',amount_ml:50}]},
{name:'White Russian',description:'Vodka, kaffelikør og fløte.',ingredients:[{ingredient:'Vodka',amount_ml:50},{ingredient:'Kahlúa',amount_ml:25},{ingredient:'Cream',amount_ml:25}]},
{name:'Black Russian',description:'Vodka og kaffelikør.',ingredients:[{ingredient:'Vodka',amount_ml:50},{ingredient:'Kahlúa',amount_ml:25}]},
{name:'Amaretto Sour',description:'Amaretto, sitron og sukker.',ingredients:[{ingredient:'Amaretto',amount_ml:50},{ingredient:'Lemon juice',amount_ml:30},{ingredient:'Sugar syrup',amount_ml:15}]},
{name:'Dark ’n’ Stormy',description:'Mørk rom, lime og ginger beer.',ingredients:[{ingredient:'Dark rum',amount_ml:50},{ingredient:'Lime juice',amount_ml:20},{ingredient:'Ginger beer',amount_ml:120}]}
]
