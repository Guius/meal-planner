import axios, { AxiosResponse } from 'axios';

async function main() {
  const res: AxiosResponse = await axios.put(
    'http://localhost:3000/scraping/update1',
    {},
  );
  console.log(res.data);
}

main();
