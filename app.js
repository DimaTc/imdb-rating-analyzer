const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const app = express();

const port = process.env.PORT || 3001;

app.use(express.static(__dirname + "/dist/imdbRatings"));

const imdbSearchData = (req, res, next) => {
  if (req.path !== "/api/search") {
    next();
    return;
  }
  let query = req.body.q;
  if (query.length > 0) query = query.toLowerCase();
  if (query !== undefined && query.length > 0) {
    try {
      let url = `https://v2.sg.media-imdb.com/suggestion/${query[0]}/${query}.json`;
      axios
        .get(url)
        .then(search => {
          let allItems = search.data;
          if (allItems.d != undefined) {
            relevantItems = allItems.d.filter(item => {
              return item.q != undefined && (item.q == "TV series" || item.q == "TV mini-series");
            });
            req.imdbData = relevantItems;
            next();
          }
        })
        .catch(err => {
          res.send(
            JSON.stringify({
              error: "Server Error",
              errorMessage: err.response.data.message
            })
          );
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
  try {
    let id = req.body.id;
    if (id !== undefined && id.length > 0) {
      let url = `https://www.imdb.com/title/${id}/`;
      axios
        .get(url)
        .then(bodyRaw => {
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
        })
        .catch(err => {
          res.send(
            JSON.stringify({
              error: "Server Error",
              error_message: err.data
            })
          );
        });
    } else {
      console.log("titleLoader: invalid ID");
      console.log(req.body);
      next();
    }
  } catch (e) {
    Console.log("Error:" + e);
    next();
  }
};

const loadSeasons = (req, res, next) => {
  if (req.path !== "/api/title") {
    next();
    return;
  }
  try {
    if (req.title !== undefined) {
      loadRatings(req.title.id, req.maxSeason).then(res => {
        req.title.seasons = res;
        next();
      });
    } else {
      console.log("loadSeason not request title");
      next();
    }
  } catch (e) {
    Console.log("Error:" + e);
    next();
  }
};

const logger = (req, res, next) => {
  console.log("================================================");
  console.log(`got request from ${req.connection.remoteAddress}`);
  console.log(`path - ${req.path}`);
  console.log(`body - ${JSON.stringify(req.body)}`);
  console.log("================================================");
  next();
};

const loadRatings = (titleId, maxSeason) => {
  //   if (!seasonArray instanceof Array) return;
  return new Promise(async (resolve, reject) => {
    try {
      let counter = 0;
      let seasons = [];
      for (let i = 1; i <= maxSeason; i++) {
        //   seasons = await Promise.all(
        // seasonArray.map(async item => {
        let season = {};
        season.number = i;
        axios.get(`https://www.imdb.com/title/${titleId}/episodes?season=${i}`).then(res => {
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
          counter++;
          if (counter == maxSeason) resolve(seasons);
        });
      }
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
app.use(logger);

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
  let seasons = [];
  if (req.title != undefined && req.title.seasons != undefined) {
    let resSeasons = req.title.seasons;
    if (resSeasons instanceof Array) seasons = resSeasons.sort((a, b) => a.number - b.number);
  }
  res.send(JSON.stringify(req.title));
});

app.get("*", (req, res) => {
  res.sendFile("index.html");
});

app.listen(port, () => {
  console.log(`listening on port ${port}...`);
});
