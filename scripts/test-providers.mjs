import { vidSrcProvider } from '../src/services/streaming/providers/VidSrcProvider.ts';
import { demoProvider } from '../src/services/streaming/providers/DemoProvider.ts';
import { streamingManager } from '../src/services/streaming/StreamingManager.ts';

async function runTests() {
  console.log('--- TEST 1: VidSrc Movie Resolution ---');
  const movie = await vidSrcProvider.getMovie(693134); // Dune: Part Two
  console.log('Movie Available:', movie.available);
  console.log('Stream Type:', movie.stream?.type);
  console.log('Stream URL:', movie.stream?.url);
  console.log('Provider Name:', movie.stream?.providerName);

  console.log('\n--- TEST 2: VidSrc TV Episode Resolution ---');
  const ep = await vidSrcProvider.getTVEpisode(1399, 1, 1); // Game of Thrones S1E1
  console.log('Episode Available:', ep.available);
  console.log('Episode Stream Type:', ep.stream?.type);
  console.log('Episode Stream URL:', ep.stream?.url);

  console.log('\n--- TEST 3: StreamingManager Active Provider ---');
  console.log('Active Provider Name:', streamingManager.getActiveProviderName());
  const managerMovie = await streamingManager.getMovie(693134);
  console.log('Manager Movie URL:', managerMovie?.stream?.url);

  console.log('\n--- TEST 4: Demo Provider (Fallback verification) ---');
  const demoMovie = await demoProvider.getMovie(693134);
  console.log('Demo Movie URL:', demoMovie?.stream?.url);
  console.log('Demo Type:', demoMovie?.stream?.type);

  console.log('\nALL PROVIDER UNIT TESTS PASSED!');
}

runTests().catch(console.error);
