import { Season } from "../Season";

export class SearchItem {
  imageUrl: string;
  title: string;
  id: string;
  rank: number;
  yearsActive: string;
  seasons?: Season[];
  rating?: number;
}
