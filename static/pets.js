// Pet batch-cooking data. kcal per 100 g as prepared (USDA-ish averages).
// These are TEMPLATES: they are only complete & balanced together with a
// vitamin-mineral premix made for home-cooked pet food. Check with your vet.
window.PET_ING = {
  chicken_thigh: { en: "Chicken thigh, skinless", zh: "鸡腿肉", kcal: 121 },
  chicken_breast: { en: "Chicken breast", zh: "鸡胸肉", kcal: 120 },
  chicken_heart: { en: "Chicken hearts", zh: "鸡心", kcal: 153 },
  chicken_liver: { en: "Chicken liver", zh: "鸡肝", kcal: 119 },
  turkey_mince: { en: "Turkey mince (93% lean)", zh: "火鸡肉末", kcal: 150 },
  beef_mince: { en: "Lean beef mince (90%)", zh: "瘦牛肉末", kcal: 176 },
  beef_liver: { en: "Beef liver", zh: "牛肝", kcal: 135 },
  salmon: { en: "Salmon, boneless", zh: "三文鱼", kcal: 180 },
  egg: { en: "Whole egg", zh: "鸡蛋", kcal: 143 },
  egg_yolk: { en: "Egg yolk", zh: "蛋黄", kcal: 322 },
  rice: { en: "White rice, cooked", zh: "米饭", kcal: 130 },
  oats: { en: "Oats, cooked", zh: "燕麦", kcal: 71 },
  sweet_potato: { en: "Sweet potato, cooked", zh: "红薯", kcal: 86 },
  pumpkin: { en: "Pumpkin, cooked", zh: "南瓜", kcal: 26 },
  carrot: { en: "Carrot, cooked", zh: "胡萝卜", kcal: 41 },
  green_beans: { en: "Green beans, cooked", zh: "四季豆", kcal: 31 },
  broccoli: { en: "Broccoli, cooked", zh: "西兰花", kcal: 34 },
  zucchini: { en: "Zucchini, cooked", zh: "西葫芦", kcal: 17 },
  canola_oil: { en: "Canola / sunflower oil", zh: "植物油", kcal: 884 },
  fish_oil: { en: "Fish oil", zh: "鱼油", kcal: 902 },
};

// pct = % of batch weight. Must sum to 100.
window.PET_RECIPES = [
  { id: "dog_chicken_rice", species: "dog", name: "Chicken, rice & veg", protein: "chicken",
    parts: { chicken_thigh: 40, chicken_liver: 5, rice: 35, carrot: 7, green_beans: 7, pumpkin: 4, canola_oil: 2 },
    method: "Dice chicken & liver, simmer in a little water 15 min (no salt, no onion/garlic). Steam veg until soft, mash or blitz. Cook rice plain. Cool, mix in oil + premix, portion." },
  { id: "dog_beef_sweetpotato", species: "dog", name: "Beef & sweet potato", protein: "beef",
    parts: { beef_mince: 40, beef_liver: 5, sweet_potato: 35, broccoli: 8, carrot: 7, egg: 3, fish_oil: 1, canola_oil: 1 },
    method: "Brown beef & chopped liver in a dry pan, drain excess fat. Boil or bake sweet potato, steam veg. Scramble egg. Cool, mix in oils + premix, portion." },
  { id: "dog_turkey_oats", species: "dog", name: "Turkey, oats & zucchini", protein: "turkey",
    parts: { turkey_mince: 45, egg: 8, oats: 30, zucchini: 8, carrot: 7, canola_oil: 2 },
    method: "Cook turkey through. Cook oats in water. Steam veg, grate or blitz. Scramble eggs. Cool, mix in oil + premix, portion." },
  { id: "cat_chicken", species: "cat", name: "Chicken & heart (staple)", protein: "chicken",
    parts: { chicken_thigh: 75, chicken_heart: 12, chicken_liver: 5, egg_yolk: 5, fish_oil: 1, pumpkin: 2 },
    method: "Lightly cook meat, hearts & liver (poach until just done — overcooking destroys taurine). Mince or blitz with yolks & a little cooking water. Cool, mix in fish oil + feline premix (must include taurine), portion." },
  { id: "cat_turkey", species: "cat", name: "Turkey & chicken heart", protein: "turkey",
    parts: { turkey_mince: 70, chicken_heart: 15, chicken_liver: 5, egg: 8, fish_oil: 1, pumpkin: 1 },
    method: "Gently cook turkey, hearts & liver. Scramble egg. Blitz together with cooking juices. Cool, mix in fish oil + feline premix with taurine, portion." },
  { id: "cat_chicken_salmon", species: "cat", name: "Chicken & salmon (treat week)", protein: "fish",
    parts: { chicken_thigh: 60, salmon: 20, chicken_heart: 12, chicken_liver: 5, egg_yolk: 3 },
    method: "Poach chicken, hearts, liver; bake salmon, check for bones. Blitz. Cool, mix in feline premix with taurine. Fish-heavy food max every other batch." },
];

// Daily energy: RER = 70 × kg^0.75, then × factor.
window.PET_FACTORS = {
  dog: { neutered: 1.6, intact: 1.8, lose: 1.0, inactive: 1.4, puppy: 2.0, gain: 1.8 },
  cat: { neutered: 1.2, intact: 1.4, lose: 0.8, inactive: 1.0, kitten: 2.5, gain: 1.4 },
};

// Toxic / risky foods. Matched against pantry names (zh + en).
window.PET_TOXIC = {
  both: ["洋葱", "葱", "蒜", "韭菜", "大葱", "小葱", "香葱", "葡萄", "葡萄干", "提子", "巧克力", "可可", "木糖醇",
         "酒", "啤酒", "料酒", "咖啡", "茶", "夏威夷果", "牛油果", "生面团", "onion", "garlic", "leek", "chive",
         "grape", "raisin", "sultana", "chocolate", "cocoa", "xylitol", "alcohol", "wine", "beer", "coffee",
         "macadamia", "avocado", "scallion", "spring onion"],
  dog: [],
  cat: ["百合", "lily"],
};
