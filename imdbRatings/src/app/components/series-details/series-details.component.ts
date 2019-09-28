import { Episode } from "./../Episode";
import { SearchItem } from "./../search-item/SearchItem";
import { Component, OnInit, Input } from "@angular/core";

@Component({
  selector: "series-details",
  templateUrl: "./series-details.component.html",
  styleUrls: ["./series-details.component.scss"]
})
export class SeriesDetailsComponent implements OnInit {
  @Input() title: SearchItem;

  info = {
    mostVoted: undefined,
    topRated: undefined,
    leastVoted: undefined,
    worst: undefined
  };

  constructor() {}

  ngOnInit() {
    this.getInfo();
    console.log(this.info);
  }

  getInfo() {
    this.title.seasons.forEach(season => {
      season.episodes.forEach(episode => {
        if (this.info.mostVoted == undefined || this.info.mostVoted.episode.votes < episode.votes)
          this.info.mostVoted = { episode, season };
        if (this.info.topRated == undefined || this.info.topRated.episode.rating < episode.rating)
          this.info.topRated = { episode, season };
        else if (this.info.topRated.episode.rating == episode.rating)
          if (episode.votes > this.info.topRated.episode.votes) this.info.topRated = { episode, season };

        if (this.info.leastVoted == undefined || this.info.leastVoted.episode.votes > episode.votes)
          this.info.leastVoted = { episode, season };
        if (this.info.worst == undefined || this.info.worst.episode.rating > episode.rating)
          this.info.worst = { episode, season };
          else if (this.info.topRated.episode.votes == episode.votes)
          if (episode.votes > this.info.topRated.episode.votes) this.info.topRated = { episode, season };
      });
    });
  }
}
