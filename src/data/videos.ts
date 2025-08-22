export type VideoItem = {
  id: number;
  titulo: string;
  imagen: string;
  url: string;
  duracion: string;
  canal: string;
  fecha: string; // ISO or human-readable
};

const videos: VideoItem[] = [
  {
    id: 1,
    titulo: 'La Gente es MUY PESADA',
    imagen: 'https://i.ytimg.com/vi/sN8Ftt3h03w/hqdefault.jpg?sqp=-oaymwEnCOADEI4CSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLDPKJuWomg4Hdc9dzQ5wdAJJVnXRA',
    url: 'https://static.vecteezy.com/system/resources/previews/041/704/397/mp4/a-mug-on-a-stone-near-a-fire-on-the-river-bank-close-up-travel-concept-4k-video.mp4',
    duracion: '4:12',
    canal: 'S4viSinFiltro',
    fecha: '2025-08-21',
  },
];

export default videos;
