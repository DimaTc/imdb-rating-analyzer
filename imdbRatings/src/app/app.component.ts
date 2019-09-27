import { SearchItem } from './components/search-item/SearchItem';
import { Component } from "@angular/core";
import { SearchServiceService } from "./search-service.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  title = "imdbRatings";
  searchString: String;
  dummySearchRes: SearchItem[];
  searchResult = this.dummySearchRes;

  constructor(private searchService: SearchServiceService) {}

  searchChanged(event: KeyboardEvent) {
    this.search();
  }

  search() {
    if (this.searchString != undefined && this.searchString.length > 0) this.searchService.search(this.searchString).subscribe(res=>{
      if(res instanceof Array){
        this.searchResult = res.map(item=>{

          return {
            imageUrl: item.image,
            title: item.title,
            id: item.id,
            rank: item.rank,
            yearsActive: item.years
          };
        })
      }else
      this.searchResult = [];
    });
  }
}
