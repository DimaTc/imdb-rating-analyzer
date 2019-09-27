import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { MDBBootstrapModule } from "angular-bootstrap-md";
import { FormsModule } from "@angular/forms";
import { AppComponent } from "./app.component";
import { HttpClientModule } from "@angular/common/http";

import { GraphComponent } from "./components/graph/graph.component";
import { SearchItemComponent } from "./components/search-item/search-item.component";

@NgModule({
  declarations: [AppComponent, GraphComponent, SearchItemComponent],
  imports: [BrowserModule, FormsModule, HttpClientModule, MDBBootstrapModule.forRoot()],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
