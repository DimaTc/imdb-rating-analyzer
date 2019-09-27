const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const app = express();

const imdbSearchData = (req, res, next) => {
  if (req.path !== "/api/search") {
    next();
    return;
  }
  let query = req.body.q;
  if (query !== undefined && query.length > 0) {
    try {
      let url = `https://v2.sg.media-imdb.com/suggestion/${query[0]}/${query}.json`;
      axios.get(url).then(search => {
        let allItems = search.data;
        if (allItems.d != undefined) {
          relevantItems = allItems.d.filter(item => {
            return item.q != undefined && (item.q == "TV series" || item.q == "TV mini-series");
          });
          req.imdbData = relevantItems;
          next();
        }
      });
    } catch (e) {
      console.log("Error! should do something");
      console.log("---------------------------");
      console.log(e);
      next();
    }
  } else {
    next();
  }
};

const titleLoader = (req, res, next) => {
  if (req.path !== "/api/title") {
    next();
    return;
  }

  let id = req.body.id;
  if (id !== undefined && id.length > 0) {
    let url = `https://www.imdb.com/title/${id}/`;
    axios.get(url).then(bodyRaw => {
      req.title = {};
      let body = bodyRaw.data;
      const $ = cheerio.load(body);
      let seasons = [];
      let seasonElem = $(".seasons-and-year-nav")
        .children()
        .get(3);
      $(seasonElem)
        .children()
        .each((i, e) => {
          var tmp = $(e).text();
          if (req.maxSeason == undefined || tmp * 1 > req.maxSeason) req.maxSeason = tmp * 1;
          seasons.push(tmp * 1); //easy conversion to int.
        });
      seasons.reverse();
      // req.titleId

      let titleTotalRatingElem = $(".ratingValue")
        .children()
        .get(0);
      req.title.totalRating = $(titleTotalRatingElem).text();
      // req.totalRating = $(titleTotalRatingElem).text();

      let titleDiv = $(".title_wrapper")
        .children()
        .get(0);
      req.title.name = $(titleDiv)
        .text()
        .trim();
      // req.titleName = $(titleDiv).text();

      let imageDiv = $(
        $(".poster")
          .children()
          .get(0)
      )
        .children()
        .get(0);
      req.title.imageUrl = $(imageDiv).attr("src");

      // req.titleId = id;
      req.title.id = id;
      // req.seasons = seasons
      req.title.seasons = seasons;
      next();
    });
  } else {
    console.log("titleLoader: invalid ID");
    console.log(req.body);
    next();
  }
};

const loadSeasons = (req, res, next) => {
  if (req.path !== "/api/title") {
    next();
    return;
  }
  if (req.title !== undefined) {
    loadRatings(req.title.id, req.maxSeason).then(res => {
      req.title.seasons = res;
      next();
    });
  } else {
    console.log("loadSeason not request title");
    next();
  }
};

const loadRatings = (titleId, maxSeason) => {
  //   if (!seasonArray instanceof Array) return;
  return new Promise(async (resolve, reject) => {
    try {
      let seasons = [];
      for (let i = 1; i <= maxSeason; i++) {
        //   seasons = await Promise.all(
        // seasonArray.map(async item => {
        let season = {};
        season.number = i;
        let res = await axios.get(`https://www.imdb.com/title/${titleId}/episodes?season=${i}`);
        let $ = cheerio.load(res.data);
        let episodes = [];
        $(".eplist")
          .children()
          .each((i, elem) => {
            let episode = {};
            episode.number =
              $(elem)
                .find("meta")
                .attr("content") * 1;
            let ratingTmp = $(elem)
              .find(".ipl-rating-star__rating")
              .html();
            if (ratingTmp != undefined && ratingTmp.length > 0) episode.rating = ratingTmp * 1;
            let votes = $(elem)
              .find(".ipl-rating-star__total-votes")
              .html();
            if (votes != undefined && votes.length > 0) episode.votes = votes.replace(/[\(\)\,]/g, "") * 1;

            episodes.push(episode);
          });
        season.episodes = episodes;
        seasons.push(season);
      }
      resolve(seasons);
    } catch (e) {
      console.log("Error! should do something");
      console.log("---------------------------");
      console.log(e);
      reject(e);
    }
  });
};
app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(bodyParser.json());

app.use(imdbSearchData);
app.use(titleLoader);
app.use(loadSeasons);

app.post("/api/search", (req, res) => {
  let resItems;
  if (req.imdbData != undefined)
    resItems = req.imdbData.map(item => ({
      id: item.id,
      title: item.l,
      rank: item.rank,
      image: item.i != undefined ? item.i.imageUrl : "https://api.ballotpedia.org/v3/thumbnail/",
      years: item.yr
    }));

  res.send(JSON.stringify(resItems));
});

app.post("/api/title", (req, res) => {
  res.send(JSON.stringify(req.title));
});

// app.options("/*", cors());

app.listen(8080, () => {
  console.log("listening...");
});
