import { Movie, TVShow, Genre } from '../types/tmdb';

export const MOCK_GENRES: Genre[] = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
  { id: 10759, name: 'Action & Adventure' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
];

export const MOCK_MOVIES: Movie[] = [
  {
    id: 693134,
    title: 'Dune: Part Two',
    original_title: 'Dune: Part Two',
    overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, Paul endeavors to prevent a terrible future only he can foresee.',
    poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop_path: '/xOMo8BRK7PfcJv9JCnx7s520ewq.jpg',
    release_date: '2024-02-27',
    vote_average: 8.2,
    vote_count: 5340,
    popularity: 580.4,
    genre_ids: [878, 12, 18],
    runtime: 166,
    tagline: 'Long live the fighters.',
    status: 'Released',
    budget: 190000000,
    revenue: 714444358,
    original_language: 'en',
    media_type: 'movie',
    genres: [
      { id: 878, name: 'Sci-Fi' },
      { id: 12, name: 'Adventure' },
      { id: 18, name: 'Drama' }
    ],
    videos: {
      results: [
        {
          id: 'v1',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          key: 'Way9Dexny3w',
          name: 'Official Trailer 3',
          site: 'YouTube',
          size: 1080,
          type: 'Trailer',
          official: true,
          published_at: '2023-12-12T17:00:00Z',
        }
      ]
    },
    credits: {
      cast: [
        { id: 1190668, name: 'Timothée Chalamet', original_name: 'Timothée Chalamet', character: 'Paul Atreides', profile_path: '/BE2sdjpgsa2rNTFa66f7upkaOP.jpg', order: 0 },
        { id: 505710, name: 'Zendaya', original_name: 'Zendaya', character: 'Chani', profile_path: '/so3GdeBhbMbvWaoKxmC45b9p127.jpg', order: 1 },
        { id: 932967, name: 'Rebecca Ferguson', original_name: 'Rebecca Ferguson', character: 'Lady Jessica', profile_path: '/lJloTOheuQSirSLXNA3JHsrMNfH.jpg', order: 2 },
        { id: 16828, name: 'Javier Bardem', original_name: 'Javier Bardem', character: 'Stilgar', profile_path: '/6Z5g1b8qg9v6yqM5L33J2q2pP5F.jpg', order: 3 },
        { id: 1373737, name: 'Florence Pugh', original_name: 'Florence Pugh', character: 'Princess Irulan', profile_path: '/fhEsn34lwIQ6TNsQvK9zD29R3eB.jpg', order: 4 },
        { id: 12799, name: 'Austin Butler', original_name: 'Austin Butler', character: 'Feyd-Rautha Harkonnen', profile_path: '/21Y99w3qV33g0Hh1hF5g5n4q3vB.jpg', order: 5 }
      ],
      crew: [
        { id: 137427, name: 'Denis Villeneuve', original_name: 'Denis Villeneuve', job: 'Director', department: 'Directing', profile_path: '/h4i68bS42pD30B5zU5g6N8s6D5A.jpg' },
        { id: 947, name: 'Hans Zimmer', original_name: 'Hans Zimmer', job: 'Original Music Composer', department: 'Sound', profile_path: '/tpQup17q98045v3U5P5r3h6uK3D.jpg' },
        { id: 137427, name: 'Denis Villeneuve', original_name: 'Denis Villeneuve', job: 'Screenplay', department: 'Writing', profile_path: '/h4i68bS42pD30B5zU5g6N8s6D5A.jpg' }
      ]
    }
  },
  {
    id: 872585,
    title: 'Oppenheimer',
    original_title: 'Oppenheimer',
    overview: 'The story of J. Robert Oppenheimer\'s role in the development of the atomic bomb during World War II, exploring the deep psychological and political consequences of creating humanity\'s most devastating weapon.',
    poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop_path: '/rLb2cw69rPQmm9NV6lyko59902z.jpg',
    release_date: '2023-07-19',
    vote_average: 8.1,
    vote_count: 8900,
    popularity: 420.2,
    genre_ids: [18, 36],
    runtime: 180,
    tagline: 'The world forever changes.',
    status: 'Released',
    budget: 100000000,
    revenue: 957000000,
    original_language: 'en',
    media_type: 'movie',
    genres: [
      { id: 18, name: 'Drama' },
      { id: 36, name: 'History' }
    ],
    videos: {
      results: [
        {
          id: 'v2',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          key: 'uYPbbksJxIg',
          name: 'Official Trailer',
          site: 'YouTube',
          size: 1080,
          type: 'Trailer',
          official: true,
          published_at: '2023-05-08T16:00:00Z',
        }
      ]
    },
    credits: {
      cast: [
        { id: 2037, name: 'Cillian Murphy', original_name: 'Cillian Murphy', character: 'J. Robert Oppenheimer', profile_path: '/iR1q3kM6rL1q5k5v5G9N8s6D5A.jpg', order: 0 },
        { id: 505710, name: 'Emily Blunt', original_name: 'Emily Blunt', character: 'Katherine Oppenheimer', profile_path: '/so3GdeBhbMbvWaoKxmC45b9p127.jpg', order: 1 },
        { id: 1892, name: 'Matt Damon', original_name: 'Matt Damon', character: 'Leslie Groves', profile_path: '/elzaMm5rK5v5G9N8s6D5A.jpg', order: 2 },
        { id: 3223, name: 'Robert Downey Jr.', original_name: 'Robert Downey Jr.', character: 'Lewis Strauss', profile_path: '/5qHNjhtjMD4YWH3ju6V0EGtTDYv.jpg', order: 3 }
      ],
      crew: [
        { id: 525, name: 'Christopher Nolan', original_name: 'Christopher Nolan', job: 'Director', department: 'Directing', profile_path: '/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg' }
      ]
    }
  },
  {
    id: 157336,
    title: 'Interstellar',
    original_title: 'Interstellar',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    release_date: '2014-11-05',
    vote_average: 8.4,
    vote_count: 34500,
    popularity: 310.8,
    genre_ids: [12, 18, 878],
    runtime: 169,
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    status: 'Released',
    budget: 165000000,
    revenue: 701729206,
    original_language: 'en',
    media_type: 'movie',
    genres: [
      { id: 12, name: 'Adventure' },
      { id: 18, name: 'Drama' },
      { id: 878, name: 'Sci-Fi' }
    ],
    videos: {
      results: [
        {
          id: 'v3',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          key: 'zSWdZVtXT7E',
          name: 'Official Trailer 3',
          site: 'YouTube',
          size: 1080,
          type: 'Trailer',
          official: true,
          published_at: '2014-07-30T17:00:00Z',
        }
      ]
    },
    credits: {
      cast: [
        { id: 10297, name: 'Matthew McConaughey', original_name: 'Matthew McConaughey', character: 'Joseph Cooper', profile_path: '/wDeAnFfMsz0sR2M4t4bK8jG8o9V.jpg', order: 0 },
        { id: 1813, name: 'Anne Hathaway', original_name: 'Anne Hathaway', character: 'Dr. Amelia Brand', profile_path: '/tLpq59GzE7Hk0vH4Q8jG8o9V.jpg', order: 1 },
        { id: 83002, name: 'Jessica Chastain', original_name: 'Jessica Chastain', character: 'Murphy Cooper (Adult)', profile_path: '/vOwYjO2yD8zP0vH4Q8jG8o9V.jpg', order: 2 },
        { id: 3895, name: 'Michael Caine', original_name: 'Michael Caine', character: 'Professor John Brand', profile_path: '/bvqlD6d8bK8jG8o9V.jpg', order: 3 }
      ],
      crew: [
        { id: 525, name: 'Christopher Nolan', original_name: 'Christopher Nolan', job: 'Director', department: 'Directing', profile_path: '/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg' }
      ]
    }
  },
  {
    id: 27205,
    title: 'Inception',
    original_title: 'Inception',
    overview: 'Cobb, a skilled thief who steals corporate secrets through the use of dream-sharing technology, is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.',
    poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    backdrop_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    release_date: '2010-07-15',
    vote_average: 8.4,
    vote_count: 36000,
    popularity: 290.0,
    genre_ids: [28, 12, 878],
    runtime: 148,
    tagline: 'Your mind is the scene of the crime.',
    status: 'Released',
    budget: 160000000,
    revenue: 825532764,
    original_language: 'en',
    media_type: 'movie',
    genres: [
      { id: 28, name: 'Action' },
      { id: 12, name: 'Adventure' },
      { id: 878, name: 'Sci-Fi' }
    ],
    videos: {
      results: [
        {
          id: 'v4',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          key: 'YoHD9XEInc0',
          name: 'Official Trailer',
          site: 'YouTube',
          size: 1080,
          type: 'Trailer',
          official: true,
          published_at: '2010-05-10T12:00:00Z',
        }
      ]
    },
    credits: {
      cast: [
        { id: 6193, name: 'Leonardo DiCaprio', original_name: 'Leonardo DiCaprio', character: 'Dom Cobb', profile_path: '/wo2hxAzv7V2v1fkoAjO1L0q1vB.jpg', order: 0 },
        { id: 24045, name: 'Joseph Gordon-Levitt', original_name: 'Joseph Gordon-Levitt', character: 'Arthur', profile_path: '/dHnV9tYyO4zP0vH4Q8jG8o9V.jpg', order: 1 },
        { id: 27578, name: 'Elliot Page', original_name: 'Elliot Page', character: 'Ariadne', profile_path: '/tpQup17q98045v3U5P5r3h6uK3D.jpg', order: 2 },
        { id: 2524, name: 'Tom Hardy', original_name: 'Tom Hardy', character: 'Eames', profile_path: '/yxNcaJ99w3qV33g0Hh1hF5g5n4q.jpg', order: 3 }
      ],
      crew: [
        { id: 525, name: 'Christopher Nolan', original_name: 'Christopher Nolan', job: 'Director', department: 'Directing', profile_path: '/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg' }
      ]
    }
  },
  {
    id: 155,
    title: 'The Dark Knight',
    original_title: 'The Dark Knight',
    overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets. The partnership proves to be effective, but they soon find themselves prey to a reign of chaos unleashed by a rising criminal mastermind known to the terrified citizens of Gotham as the Joker.',
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop_path: '/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
    release_date: '2008-07-16',
    vote_average: 8.5,
    vote_count: 32000,
    popularity: 280.5,
    genre_ids: [18, 28, 80, 53],
    runtime: 152,
    tagline: 'Welcome to a world without rules.',
    status: 'Released',
    budget: 185000000,
    revenue: 1004558444,
    original_language: 'en',
    media_type: 'movie',
    genres: [
      { id: 18, name: 'Drama' },
      { id: 28, name: 'Action' },
      { id: 80, name: 'Crime' },
      { id: 53, name: 'Thriller' }
    ],
    videos: {
      results: [
        {
          id: 'v5',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          key: 'EXeTwQWrcwY',
          name: 'The Dark Knight Trailer',
          site: 'YouTube',
          size: 1080,
          type: 'Trailer',
          official: true,
          published_at: '2008-05-02T12:00:00Z',
        }
      ]
    },
    credits: {
      cast: [
        { id: 3894, name: 'Christian Bale', original_name: 'Christian Bale', character: 'Bruce Wayne / Batman', profile_path: '/b7fTC9WFkgqGOv77mLQ09vK4Q8j.jpg', order: 0 },
        { id: 1810, name: 'Heath Ledger', original_name: 'Heath Ledger', character: 'Joker', profile_path: '/5qHNjhtjMD4YWH3ju6V0EGtTDYv.jpg', order: 1 },
        { id: 3895, name: 'Michael Caine', original_name: 'Michael Caine', character: 'Alfred Pennyworth', profile_path: '/bvqlD6d8bK8jG8o9V.jpg', order: 2 },
        { id: 64, name: 'Gary Oldman', original_name: 'Gary Oldman', character: 'James Gordon', profile_path: '/21Y99w3qV33g0Hh1hF5g5n4q3vB.jpg', order: 3 }
      ],
      crew: [
        { id: 525, name: 'Christopher Nolan', original_name: 'Christopher Nolan', job: 'Director', department: 'Directing', profile_path: '/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg' }
      ]
    }
  },
  {
    id: 550,
    title: 'Fight Club',
    original_title: 'Fight Club',
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.',
    poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    release_date: '1999-10-15',
    vote_average: 8.4,
    vote_count: 28500,
    popularity: 180.0,
    genre_ids: [18, 53],
    runtime: 139,
    tagline: 'Mischief. Mayhem. Soap.',
    status: 'Released',
    budget: 63000000,
    revenue: 100853753,
    original_language: 'en',
    media_type: 'movie',
    genres: [
      { id: 18, name: 'Drama' },
      { id: 53, name: 'Thriller' }
    ],
    videos: {
      results: [
        {
          id: 'v6',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          key: 'qtRKdV9EI4U',
          name: 'Fight Club Official Trailer',
          site: 'YouTube',
          size: 1080,
          type: 'Trailer',
          official: true,
          published_at: '1999-09-01T12:00:00Z',
        }
      ]
    },
    credits: {
      cast: [
        { id: 819, name: 'Edward Norton', original_name: 'Edward Norton', character: 'The Narrator', profile_path: '/5qHNjhtjMD4YWH3ju6V0EGtTDYv.jpg', order: 0 },
        { id: 287, name: 'Brad Pitt', original_name: 'Brad Pitt', character: 'Tyler Durden', profile_path: '/wo2hxAzv7V2v1fkoAjO1L0q1vB.jpg', order: 1 },
        { id: 1283, name: 'Helena Bonham Carter', original_name: 'Helena Bonham Carter', character: 'Marla Singer', profile_path: '/dHnV9tYyO4zP0vH4Q8jG8o9V.jpg', order: 2 }
      ],
      crew: [
        { id: 7467, name: 'David Fincher', original_name: 'David Fincher', job: 'Director', department: 'Directing', profile_path: '/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg' }
      ]
    }
  },
  {
    id: 603,
    title: 'The Matrix',
    original_title: 'The Matrix',
    overview: 'Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.',
    poster_path: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    backdrop_path: '/7u3Px2VsPqckR96zZ2Fw5vW6H7f.jpg',
    release_date: '1999-03-30',
    vote_average: 8.2,
    vote_count: 25000,
    popularity: 195.0,
    genre_ids: [28, 878],
    runtime: 136,
    tagline: 'Welcome to the Real World.',
    status: 'Released',
    budget: 63000000,
    revenue: 463517383,
    original_language: 'en',
    media_type: 'movie',
    genres: [
      { id: 28, name: 'Action' },
      { id: 878, name: 'Sci-Fi' }
    ],
    videos: {
      results: [
        {
          id: 'v7',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          key: 'vKQi3bBA1y8',
          name: 'The Matrix Trailer',
          site: 'YouTube',
          size: 1080,
          type: 'Trailer',
          official: true,
          published_at: '1999-02-15T12:00:00Z',
        }
      ]
    },
    credits: {
      cast: [
        { id: 6384, name: 'Keanu Reeves', original_name: 'Keanu Reeves', character: 'Thomas A. Anderson / Neo', profile_path: '/4D0PpNI0kmP58hgrwGC3wC5G0Ry.jpg', order: 0 },
        { id: 2975, name: 'Laurence Fishburne', original_name: 'Laurence Fishburne', character: 'Morpheus', profile_path: '/8qBuzbpEnGI9N6LAq45D9N8s6D5.jpg', order: 1 },
        { id: 530, name: 'Carrie-Anne Moss', original_name: 'Carrie-Anne Moss', character: 'Trinity', profile_path: '/xDq6yTfH7yN5r77mLQ09vK4Q8j.jpg', order: 2 }
      ],
      crew: [
        { id: 9339, name: 'Lilly Wachowski', original_name: 'Lilly Wachowski', job: 'Director', department: 'Directing', profile_path: null },
        { id: 9340, name: 'Lana Wachowski', original_name: 'Lana Wachowski', job: 'Director', department: 'Directing', profile_path: null }
      ]
    }
  },
  {
    id: 533535,
    title: 'Deadpool & Wolverine',
    original_title: 'Deadpool & Wolverine',
    overview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.',
    poster_path: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop_path: '/yDHYTfA3R0jFYba16jBB1jv8uaC.jpg',
    release_date: '2024-07-24',
    vote_average: 7.7,
    vote_count: 4200,
    popularity: 650.0,
    genre_ids: [28, 35, 878],
    runtime: 128,
    tagline: 'Come together.',
    status: 'Released',
    budget: 200000000,
    revenue: 1337000000,
    original_language: 'en',
    media_type: 'movie',
    genres: [
      { id: 28, name: 'Action' },
      { id: 35, name: 'Comedy' },
      { id: 878, name: 'Sci-Fi' }
    ],
    videos: {
      results: [
        {
          id: 'v8',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          key: '73_1biulkYk',
          name: 'Official Trailer',
          site: 'YouTube',
          size: 1080,
          type: 'Trailer',
          official: true,
          published_at: '2024-04-22T13:00:00Z',
        }
      ]
    },
    credits: {
      cast: [
        { id: 10859, name: 'Ryan Reynolds', original_name: 'Ryan Reynolds', character: 'Wade Wilson / Deadpool', profile_path: '/h1r55g9N8s6D5A.jpg', order: 0 },
        { id: 6968, name: 'Hugh Jackman', original_name: 'Hugh Jackman', character: 'Logan / Wolverine', profile_path: '/4D0PpNI0kmP58hgrwGC3wC5G0Ry.jpg', order: 1 }
      ],
      crew: [
        { id: 17825, name: 'Shawn Levy', original_name: 'Shawn Levy', job: 'Director', department: 'Directing', profile_path: null }
      ]
    }
  }
];

export const MOCK_TV_SHOWS: TVShow[] = [
  {
    id: 94605,
    name: 'Arcane',
    original_name: 'Arcane',
    overview: 'Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and incompatible convictions.',
    poster_path: '/abf8tHznhSvl9an90mi4Zg91CMe.jpg',
    backdrop_path: '/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
    first_air_date: '2021-11-06',
    vote_average: 8.7,
    vote_count: 4100,
    popularity: 380.0,
    genre_ids: [16, 10765, 10759, 18],
    number_of_seasons: 2,
    number_of_episodes: 18,
    tagline: 'Every legend has a beginning.',
    status: 'Ended',
    original_language: 'en',
    media_type: 'tv',
    genres: [
      { id: 16, name: 'Animation' },
      { id: 10765, name: 'Sci-Fi & Fantasy' },
      { id: 10759, name: 'Action & Adventure' },
      { id: 18, name: 'Drama' }
    ],
    videos: {
      results: [
        {
          id: 'v_tv1',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          key: 'fXmAurh012s',
          name: 'Official Trailer',
          site: 'YouTube',
          size: 1080,
          type: 'Trailer',
          official: true,
          published_at: '2021-10-31T17:00:00Z',
        }
      ]
    },
    credits: {
      cast: [
        { id: 109513, name: 'Hailee Steinfeld', original_name: 'Hailee Steinfeld', character: 'Vi (voice)', profile_path: '/so3GdeBhbMbvWaoKxmC45b9p127.jpg', order: 0 },
        { id: 1640578, name: 'Ella Purnell', original_name: 'Ella Purnell', character: 'Jinx (voice)', profile_path: '/lJloTOheuQSirSLXNA3JHsrMNfH.jpg', order: 1 },
        { id: 122822, name: 'Katie Leung', original_name: 'Katie Leung', character: 'Caitlyn Kiramman (voice)', profile_path: null, order: 2 }
      ],
      crew: [
        { id: 12345, name: 'Christian Linke', original_name: 'Christian Linke', job: 'Creator', department: 'Production', profile_path: null }
      ]
    },
    seasons: [
      {
        id: 134187,
        name: 'Season 1',
        overview: 'Orphaned sisters Vi and Powder navigate the undercity of Zaun until an invention in affluent Piltover changes everything.',
        poster_path: '/abf8tHznhSvl9an90mi4Zg91CMe.jpg',
        season_number: 1,
        episode_count: 9,
        air_date: '2021-11-06',
        episodes: [
          {
            id: 3290451,
            name: 'Welcome to the Playground',
            overview: 'Orphaned sisters Vi and Powder bring trouble to Zaun\'s underground streets following a heist in posh Piltover.',
            vote_average: 8.8,
            vote_count: 320,
            air_date: '2021-11-06',
            episode_number: 1,
            season_number: 1,
            still_path: '/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
            runtime: 43
          },
          {
            id: 3290452,
            name: 'Some Mysteries Are Better Left Unsolved',
            overview: 'Idealistic inventor Jayce attempts to harness arcane magic despite warnings from his mentor.',
            vote_average: 8.9,
            vote_count: 310,
            air_date: '2021-11-06',
            episode_number: 2,
            season_number: 1,
            still_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
            runtime: 40
          },
          {
            id: 3290453,
            name: 'The Base Violence Necessary for Change',
            overview: 'An epic showdown between old rivals leads to a fateful and tragic outcome for Zaun.',
            vote_average: 9.6,
            vote_count: 540,
            air_date: '2021-11-06',
            episode_number: 3,
            season_number: 1,
            still_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
            runtime: 44
          }
        ]
      }
    ]
  },
  {
    id: 110316,
    name: 'Severance',
    original_name: 'Severance',
    overview: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their jobs.',
    poster_path: '/jtUXpS5mQ6nE0j4vK9rK7jG8o9V.jpg',
    backdrop_path: '/9xxLWtn8g627sXg0N0wG6r8L6vV.jpg',
    first_air_date: '2022-02-17',
    vote_average: 8.4,
    vote_count: 1980,
    popularity: 240.0,
    genre_ids: [18, 9648, 878],
    number_of_seasons: 2,
    number_of_episodes: 19,
    tagline: 'Please do not attempt to contact your outie.',
    status: 'Returning Series',
    original_language: 'en',
    media_type: 'tv',
    genres: [
      { id: 18, name: 'Drama' },
      { id: 9648, name: 'Mystery' },
      { id: 878, name: 'Sci-Fi' }
    ],
    videos: {
      results: [
        {
          id: 'v_tv2',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          key: 'xEQP4VVuyrY',
          name: 'Official Trailer',
          site: 'YouTube',
          size: 1080,
          type: 'Trailer',
          official: true,
          published_at: '2022-01-18T16:00:00Z',
        }
      ]
    },
    credits: {
      cast: [
        { id: 2038, name: 'Adam Scott', original_name: 'Adam Scott', character: 'Mark Scout', profile_path: null, order: 0 },
        { id: 1032, name: 'Patricia Arquette', original_name: 'Patricia Arquette', character: 'Harmony Cobel', profile_path: null, order: 1 },
        { id: 1253, name: 'John Turturro', original_name: 'John Turturro', character: 'Irving Bailiff', profile_path: null, order: 2 },
        { id: 4783, name: 'Christopher Walken', original_name: 'Christopher Walken', character: 'Burt Goodman', profile_path: null, order: 3 }
      ],
      crew: [
        { id: 73421, name: 'Ben Stiller', original_name: 'Ben Stiller', job: 'Executive Producer / Director', department: 'Directing', profile_path: null }
      ]
    },
    seasons: [
      {
        id: 165432,
        name: 'Season 1',
        overview: 'Mark Scout leads a team at Lumon Industries whose employees have undergone a severance procedure.',
        poster_path: '/jtUXpS5mQ6nE0j4vK9rK7jG8o9V.jpg',
        season_number: 1,
        episode_count: 9,
        air_date: '2022-02-17',
        episodes: [
          {
            id: 3456781,
            name: 'Good News About Hell',
            overview: 'Mark Scout gets promoted at Lumon Industries following a colleague\'s sudden departure.',
            vote_average: 8.3,
            vote_count: 140,
            air_date: '2022-02-17',
            episode_number: 1,
            season_number: 1,
            still_path: '/9xxLWtn8g627sXg0N0wG6r8L6vV.jpg',
            runtime: 57
          },
          {
            id: 3456782,
            name: 'Half Loop',
            overview: 'The team trains Helly on data refinement as Mark encounters Petey on the outside.',
            vote_average: 8.5,
            vote_count: 135,
            air_date: '2022-02-17',
            episode_number: 2,
            season_number: 1,
            still_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
            runtime: 53
          }
        ]
      }
    ]
  },
  {
    id: 100088,
    name: 'The Last of Us',
    original_name: 'The Last of Us',
    overview: 'Twenty years after modern civilization has been destroyed, Joel, a hardened survivor, is hired to smuggle Ellie, a 14-year-old girl, out of an oppressive quarantine zone. What starts as a small job soon becomes a brutal, heartbreaking journey, as they both must traverse the U.S. and depend on each other for survival.',
    poster_path: '/uKvVjHNqB5VmOrdxqAt2V7JMrne.jpg',
    backdrop_path: '/9z2hkNTyEogz6zCzp4k3o8N6PZq.jpg',
    first_air_date: '2023-01-15',
    vote_average: 8.6,
    vote_count: 5120,
    popularity: 290.0,
    genre_ids: [18, 10765, 10759],
    number_of_seasons: 2,
    number_of_episodes: 16,
    tagline: 'When you\'re lost in the darkness, look for the light.',
    status: 'Returning Series',
    original_language: 'en',
    media_type: 'tv',
    genres: [
      { id: 18, name: 'Drama' },
      { id: 10765, name: 'Sci-Fi & Fantasy' },
      { id: 10759, name: 'Action & Adventure' }
    ],
    videos: {
      results: [
        {
          id: 'v_tv3',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          key: 'uLtkt8BonwM',
          name: 'Official Trailer',
          site: 'YouTube',
          size: 1080,
          type: 'Trailer',
          official: true,
          published_at: '2022-12-03T21:00:00Z',
        }
      ]
    },
    credits: {
      cast: [
        { id: 1253360, name: 'Pedro Pascal', original_name: 'Pedro Pascal', character: 'Joel Miller', profile_path: '/4D0PpNI0kmP58hgrwGC3wC5G0Ry.jpg', order: 0 },
        { id: 2044810, name: 'Bella Ramsey', original_name: 'Bella Ramsey', character: 'Ellie Williams', profile_path: '/so3GdeBhbMbvWaoKxmC45b9p127.jpg', order: 1 }
      ],
      crew: [
        { id: 135432, name: 'Craig Mazin', original_name: 'Craig Mazin', job: 'Creator', department: 'Writing', profile_path: null },
        { id: 135433, name: 'Neil Druckmann', original_name: 'Neil Druckmann', job: 'Creator', department: 'Writing', profile_path: null }
      ]
    }
  },
  {
    id: 1396,
    name: 'Breaking Bad',
    original_name: 'Breaking Bad',
    overview: 'Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of two years left to live. He chooses to enter the dangerous world of drugs and crime with the goal of securing his family\'s financial future before he dies.',
    poster_path: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
    backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    first_air_date: '2008-01-20',
    vote_average: 8.9,
    vote_count: 14500,
    popularity: 280.0,
    genre_ids: [18, 80],
    number_of_seasons: 5,
    number_of_episodes: 62,
    tagline: 'Change the equation.',
    status: 'Ended',
    original_language: 'en',
    media_type: 'tv',
    genres: [
      { id: 18, name: 'Drama' },
      { id: 80, name: 'Crime' }
    ],
    videos: {
      results: [
        {
          id: 'v_tv4',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          key: 'HhesaQXLuRY',
          name: 'Series Trailer',
          site: 'YouTube',
          size: 1080,
          type: 'Trailer',
          official: true,
          published_at: '2008-01-10T12:00:00Z',
        }
      ]
    },
    credits: {
      cast: [
        { id: 17419, name: 'Bryan Cranston', original_name: 'Bryan Cranston', character: 'Walter White', profile_path: '/wo2hxAzv7V2v1fkoAjO1L0q1vB.jpg', order: 0 },
        { id: 84497, name: 'Aaron Paul', original_name: 'Aaron Paul', character: 'Jesse Pinkman', profile_path: '/dHnV9tYyO4zP0vH4Q8jG8o9V.jpg', order: 1 }
      ],
      crew: [
        { id: 66633, name: 'Vince Gilligan', original_name: 'Vince Gilligan', job: 'Creator', department: 'Writing', profile_path: null }
      ]
    }
  },
  {
    id: 66732,
    name: 'Stranger Things',
    original_name: 'Stranger Things',
    overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    poster_path: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    backdrop_path: '/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    first_air_date: '2016-07-15',
    vote_average: 8.6,
    vote_count: 17200,
    popularity: 260.0,
    genre_ids: [10765, 18, 9648],
    number_of_seasons: 4,
    number_of_episodes: 34,
    tagline: 'Every ending has a beginning.',
    status: 'Returning Series',
    original_language: 'en',
    media_type: 'tv',
    genres: [
      { id: 10765, name: 'Sci-Fi & Fantasy' },
      { id: 18, name: 'Drama' },
      { id: 9648, name: 'Mystery' }
    ],
    videos: {
      results: [
        {
          id: 'v_tv5',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          key: 'b9EkMc79ZSU',
          name: 'Official Trailer',
          site: 'YouTube',
          size: 1080,
          type: 'Trailer',
          official: true,
          published_at: '2016-06-09T14:00:00Z',
        }
      ]
    },
    credits: {
      cast: [
        { id: 135651, name: 'Millie Bobby Brown', original_name: 'Millie Bobby Brown', character: 'Eleven', profile_path: null, order: 0 },
        { id: 10989, name: 'Winona Ryder', original_name: 'Winona Ryder', character: 'Joyce Byers', profile_path: null, order: 1 },
        { id: 3497, name: 'David Harbour', original_name: 'David Harbour', character: 'Jim Hopper', profile_path: null, order: 2 }
      ],
      crew: [
        { id: 1176214, name: 'The Duffer Brothers', original_name: 'The Duffer Brothers', job: 'Creator', department: 'Writing', profile_path: null }
      ]
    }
  }
];
