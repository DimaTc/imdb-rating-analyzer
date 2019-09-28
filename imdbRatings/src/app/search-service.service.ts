import { environment } from "./../environments/environment";
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root"
})
export class SearchServiceService {
  constructor(private httpClient: HttpClient) {}

  public search(q: string) {
    return this.httpClient.post(environment.apiUrl + "api/search", { q }, { headers: { "content-type": "application/json" } });
  }

  public loadTitle(id: string) {
    return this.httpClient.post(environment.apiUrl + "api/title", { id }, { headers: { "content-type": "application/json" } });
  }
}
