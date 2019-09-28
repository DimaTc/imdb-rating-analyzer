import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root"
})
export class SearchServiceService {
  constructor(private httpClient: HttpClient) {}

  public search(query: string) {
    return this.httpClient.post(
      "http://localhost:8080/api/search",
      { q: query },
      {
        headers: { "content-type": "application/json" }
      }
    );
  }

  public loadTitle(id: string) {
    return this.httpClient.post(
      "http://localhost:8080/api/title",
      { id },
      { headers: { "content-type": "application/json" } }
    );
  }
}
