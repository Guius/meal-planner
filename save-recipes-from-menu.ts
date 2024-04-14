import axios, { AxiosError, AxiosResponse } from 'axios';

async function main(week: string) {
  // Get menu
  let numberOfDuplicates: number;

  let menu;
  try {
    console.log(`👀 Getting menu for week ${week}`);
    const res: AxiosResponse = await axios.get(
      `http://localhost:3000/scraping/menu/${week}`,
    );
    menu = res.data;
  } catch (err) {
    console.error(`Could not get menu: ${JSON.stringify(err)}`);
    process.exit(1);
  }

  console.log(`✅ Successfully got menu for week ${week}.`);

  for (let i = 0; i < menu.length; i++) {
    console.log(
      `🕣 Getting recipe ${i + 1}: (${menu[i]}). Wating two second first`,
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const currentRecipe = menu[i];

    // scrape the recipe from hello fresh
    let recipeJson: Record<string, unknown>;
    try {
      console.log(`👀 Getting recipe ${currentRecipe}`);
      const res: AxiosResponse = await axios.get(
        `http://localhost:3000/scraping/recipe/${currentRecipe}`,
      );
      recipeJson = res.data;
    } catch (err) {
      console.error(
        `💣 Could not get recipe: ${JSON.stringify(err)}. Skipping this item`,
      );
      continue;
    }

    console.log(`✅ Successfully got recipe ${currentRecipe}`);

    // save it to the database
    try {
      console.log(`📝 Saving recipe ${currentRecipe}`);
      await axios.post(
        `http://localhost:3000/scraping/recipe/${currentRecipe}`,
        recipeJson,
      );
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.name === 'ConditionalCheckFailedException') {
          numberOfDuplicates++;
          console.log(`👎 Duplicate recipe ${currentRecipe}. Skipping.`);
        } else {
          console.error(
            `💣 Could not save recipe: ${JSON.stringify(
              err,
            )}. Skipping this item`,
          );
        }
      }
      continue;
    }
    console.log(`👍 Successfully saved recipe ${currentRecipe}`);
  }

  console.log(
    `👏 Successfully saved ${
      menu.length - numberOfDuplicates
    } recipes. Total recipes: ${
      menu.length
    }. Duplicates: ${numberOfDuplicates}`,
  );
}

main('2024-W16');
