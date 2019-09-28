import { SearchItem } from "./components/search-item/SearchItem";
import { Component } from "@angular/core";
import { SearchServiceService } from "./search-service.service";
import { Season } from "./components/Season";
import { Episode } from "./components/Episode";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  title = "imdbRatings";
  searchString: string;
  searchResult: SearchItem[];
  selectedTitle: SearchItem;
  selectedSeason: Season;
  seasonButtons: Season[];
  isLoading: boolean;
  error: string;
  errorMessage: string;
  constructor(private searchService: SearchServiceService) {}

  searchChanged(event: KeyboardEvent) {
    if (this.searchString != undefined && this.searchString.trim().length > 0) this.search();
    else {
      this.searchResult = undefined;
      this.error = undefined;
      this.errorMessage = undefined;
    }
  }

  search() {
    if (this.searchString != undefined && this.searchString.length > 0)
      this.searchService.search(this.searchString).subscribe((res: any) => {
        if (res instanceof Array) {
          this.error = undefined;
          this.errorMessage = undefined;
          this.searchResult = res.map(item => {
            return {
              imageUrl: item.image,
              title: item.title,
              id: item.id,
              rank: item.rank,
              yearsActive: item.years
            };
          });
        } else {
          this.searchResult = [];
          this.error = res.error;
          this.errorMessage = res.errorMessage;
        }
      });
  }

  selectTitle(item: SearchItem) {
    this.isLoading = true;
    this.selectedSeason = undefined;
    this.selectedTitle = item;
    this.searchResult = [];
    this.searchString = "";
    this.searchService.loadTitle(item.id).subscribe((res: any) => {
      if (res.id == undefined) return;
      this.isLoading = false;
      this.selectedTitle.rating = res.totalRating;
      this.populateSeasons(res);
      this.seasonButtons = this.selectedTitle.seasons;
    });
  }

  populateSeasons(res: any) {
    if (this.selectedTitle == undefined || !(res.seasons instanceof Array)) return;
    this.selectedTitle.seasons = res.seasons.map((season: Season) => {
      let avgRating = -1;
      let numberOfRatedEpisode = 0;
      season.episodes.forEach((episode: Episode) => {
        if (episode.rating) {
          numberOfRatedEpisode++;
          avgRating = episode.rating + (numberOfRatedEpisode == 0 ? 0 : avgRating);
        }
      });
      avgRating = numberOfRatedEpisode != 0 ? avgRating / numberOfRatedEpisode : undefined;
      return {
        ...season,
        avgRating: avgRating
      };
    });
  }

  selectSeason(season: Season) {
    if (this.selectedSeason == season) {
      this.selectedSeason = undefined;
      this.seasonButtons = this.selectedTitle != undefined ? this.selectedTitle.seasons : undefined;
    } else {
      this.selectedSeason = season;
      this.seasonButtons = [season];
    }
  }
}
