import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root"
})
export class SearchServiceService {
  constructor(private httpClient: HttpClient) {}

  public search(query: String) {
    return this.httpClient.post("http://localhost:8080/api/search",{q:query},{
      headers:{'content-type':"application/json"}
    });
  }
}
