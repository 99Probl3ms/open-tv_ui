export interface Channel {
  id: string;
  name: string;
  category: string;
  favorite: boolean;
  logo: string;
  streamUrl: string;
  epgId: string;
  lastWatched?: string;
}

export interface Program {
  id: string;
  channelId: string;
  title: string;
  description: string;
  start: string;
  end: string;
}
