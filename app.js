const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();

const imdbSearchData = (req,res,next)=>{
    if(req.path !== "/api/search"){
        next();
        return;
    }
    let query = req.body.q;
    if(query !== undefined && query.length > 0){
        let url = `https://v2.sg.media-imdb.com/suggestion/${query[0]}/${query}.json`;
        axios.get(url).then(
            search=>{
                let allItems = search.data;
                if(allItems.d != undefined){
                    relevantItems = allItems.d.filter(item =>{
                        return (item.q != undefined && item.q == "TV series")
                    });
                    req.imdbData = relevantItems;
                    next();
                }

            }
            
        );
    }
}

const titleLoader = (req,res,next)=>{
    if(req.path !== "/api/title"){
        next();
        return;
    }
    
    let id = req.body.id;
    if(id !== undefined && id.length > 0){
        let url = `https://www.imdb.com/title/${id}/`;
        axios.get(url).then(
            bodyRaw=>{
                req.title = {};
                let body = bodyRaw.data;
                const $ = cheerio.load(body);
                let seasons = [];
                let seasonElem = $(".seasons-and-year-nav").children().get(3);
                $(seasonElem).children().each((i,e)=>{
                    var tmp = $(e).text();
                    seasons.push(tmp * 1); //easy conversion to int.
                });
                seasons.reverse();
                // req.titleId 
                
                let titleTotalRatingElem = $(".ratingValue").children().get(0);
                req.title.totalRating = $(titleTotalRatingElem).text();
                // req.totalRating = $(titleTotalRatingElem).text();
                                
                let titleDiv = $(".title_wrapper").children().get(0);
                req.title.name = $(titleDiv).text().trim();
                // req.titleName = $(titleDiv).text();

                let imageDiv = $($(".poster").children().get(0)).children().get(0);
                req.title.imageUrl = $(imageDiv).attr('src');

                // req.titleId = id;
                req.title.id = id;
                // req.seasons = seasons
                req.title.seasons = seasons;
                next();
            }
        );
    }else{
        next();
    }
}

const loadSeasons = (req,res, next)=>{
    if(req.path !== "/api/title"){
        next();
        return;
    }
    if(req.title !== undefined){
        loadRatings(req.title.id,req.title.seasons).then(res=>{
            req.title.seasons = res;
            next();

        });
    }else{
        next();
    }
}

const loadRatings = (titleId,seasonArray)=>{
    if(!seasonArray instanceof Array)
        return;
    return new Promise(async (resolve, reject)=>{
        let seasons =[];
        seasons = await Promise.all(seasonArray.map(async item=>{
            let season = {};
            season.number = item;
            let res = await axios.get(`https://www.imdb.com/title/${titleId}/episodes?season=${item}`);
            let $ = cheerio.load(res.data);    
            let episodes = [];
            $(".eplist").children().each((i,elem)=>{
                let episode = {};
                episode.number = $(elem).find("meta").attr("content");
                episode.rating = $(elem).find(".ipl-rating-star__rating").html();
                episodes.push(episode);
            })
            season.episodes = episodes;
            return season;
        }));
        resolve(seasons);
    })
}


app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json())

app.use(imdbSearchData);
app.use(titleLoader);
app.use(loadSeasons);

app.post("/api/search", (req,res)=>{

    let resItems = req.imdbData.map(item=>({
        id:item.id,
        title: item.l,
        rank:item.rank,
        image:item.i.imageUrl,
        years:item.yr

    }));
    
    res.send(JSON.stringify(resItems));
})


app.post("/api/title",(req,res)=>{
    res.send(JSON.stringify(req.title));
})

app.listen(8080, ()=>{
    console.log("listening...");
});
