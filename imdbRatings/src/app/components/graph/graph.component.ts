import { Season } from "./../Season";
import { SearchItem } from "./../search-item/SearchItem";
import { Component, OnInit, Input } from "@angular/core";

@Component({
  selector: "graph",
  templateUrl: "./graph.component.html",
  styleUrls: ["./graph.component.scss"]
})
export class GraphComponent implements OnInit {
  @Input() title: SearchItem;
  // @Input() season: Season;
  @Input()
  set season(season: Season) {
    if (season == undefined) this.updateGraphData(this.title.seasons);
    else this.updateGraphData([season]);
  }

  get season(): Season {
    return this.season;
  }
  _season: Season;
  chartDatasets: Array<any> = [{}, {}];
  chartLabels: Array<any> = [];

  ngOnInit() {
    if (this._season == undefined) this.updateGraphData(this.title.seasons);
    else {
      this.updateGraphData([this._season]);
    }
  }

  updateGraphData(seasons: Season[]) {
    this.chartDatasets = [{}, {}];
    this.chartLabels = [];
    seasons.forEach(season => {
      if (season == undefined) return;
      season.episodes.forEach(episode => {
        if (!episode.rating) return;
        if (this.chartDatasets[0].data == undefined) {
          this.chartDatasets[0] = {
            data: [episode.rating],
            label: "Rating",
            yAxisID: "rate"
          };
          this.chartDatasets[1] = {
            data: [episode.votes],
            label: "votes",
            yAxisID: "vote"
          };
        } else {
          this.chartDatasets[0].data.push(episode.rating);
          this.chartDatasets[1].data.push(episode.votes);
        }
        this.chartLabels = [...this.chartLabels, `s${season.number}e${episode.number}`];
      });
    });
  }

  public chartType: string = "line";

  public chartColors: Array<any> = [
    {
      backgroundColor: "rgba(105, 0, 132, .2)",
      borderColor: "rgba(200, 99, 132, .7)",
      borderWidth: 2
    },
    {
      backgroundColor: "rgba(0, 137, 132, .2)",
      borderColor: "rgba(0, 10, 130, .7)",
      borderWidth: 2
    }
  ];

  public chartOptions: any = {
    responsive: true,
    scales: {
      yAxes: [
        {
          id: "rate",
          type: "linear",
          position: "left"
        },
        {
          id: "vote",
          type: "linear",
          position: "right"
        }
      ]
    }
  };
  public chartClicked(e: any): void {}
  public chartHovered(e: any): void {}
}
