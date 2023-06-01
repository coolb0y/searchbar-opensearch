"use strict";
const { Client } = require("@elastic/elasticsearch");
const express = require("express");
const router = express.Router();
const fs = require("fs");
require("dotenv").config();

router.get("/", async (req, res, next) => {
  const searchVal = req.query.q;
  console.log(req.query.q);

  if (req.userData !== undefined) {
    const userid = req.userData.userId;
    User.updateOne({ _id: userid }, { $push: { searchterms: searchVal } });
  }

  console.log(process.env.ELASTICSEARCH_URI);
  console.log(process.env.ELASTICSEARCH_USER);
  console.log(process.env.ELASTICSEARCH_PASSWORD);

  const client = new Client({
    node: process.env.ELASTICSEARCH_URI,
    secure: false,
    auth: {
      username: process.env.ELASTICSEARCH_USER,
      password: process.env.ELASTICSEARCH_PASSWORD,
    },
    // caFingerprint: "A3:8E:56:60:8E:D6:DE:E2:86:46:CD:E9:B1:47:E3:66:14:D6:BF:0B:F2:04:A2:5F:F2:EF:4A:55:2D:78:7B:8C",

    tls: {
      rejectUnauthorized: false,
    },
  });
  // DO NOT REMOVE the commented code below code is better approach for the same only implemented when user has access
  // try {
  //     const response =await client.search({
  //       index: 'videoserver',

  //       query:
  //       {
  //        function_score: {
  //          functions: [
  //            {

  //                 gauss: {
  //                   watch_time: {
  //                     origin: 30,
  //                     scale: 2
  //                   }
  //                 }

  //               },
  //               {
  //                 gauss: {
  //                   views: {
  //                     origin: 10,
  //                     scale: 1
  //                   }
  //                 }
  //               }
  //          ],
  //          query: {
  //            bool:
  //           {must:[
  //         {bool:
  //         {must:
  //         {bool:
  //         {should:
  //         [{multi_match:
  //         {query:searchVal,
  //         fields:["title_f^10","uploader_name^7","description^1"],type:"best_fields",operator:"or",fuzziness:"AUTO"}},
  //         {multi_match:
  //         {query:searchVal,fields:["title_f^10","uploader_name^7","description^1"],type:"phrase",operator:"or"}},
  //         {multi_match:
  //         {query:searchVal,fields:["title_f^10","uploader_name^7","description^1"],type:"phrase_prefix",operator:"or"}}],minimum_should_match:0}}}}]}}
  //          }

  //       },size:10,_source:{includes:["views","likes","uploader_name","uploader_image","dislikes","created_at","thumbnail_path","description","watch_time"],excludes:[]},from:0

  //       }
  //     )

  //     // It might be useful to configure http control caching headers
  //     // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
  //     // res.setHeader('stale-while-revalidate', '30')
  //     console.log(response)
  //     res.json(response)
  //   }
  //   catch (err) {
  //     res.status(err.statusCode || 500)
  //     res.json({
  //       error: err.name,
  //       message: err.message,
  //       statusCode: err.statusCode || 500
  //     })
  //   }
  if (typeof req.query.q !== "string") {
    res.status(400);
    res.json({
      error: "Bad Request",
      message: 'Missing parameter "query.q"',
      statusCode: 400,
    });
    return;
  }

  try {
    const response = await client.search({
      index: "videoserver",

      query: {
        function_score: {
          script_score: {
            script: {
              source:
                "Math.log(2 + doc['likes'].value + doc['views'].value + doc['watch_time'].value)",
            },
          },
          query: {
            bool: {
              must: [
                {
                  bool: {
                    must: {
                      bool: {
                        should: [
                          {
                            multi_match: {
                              query: searchVal,
                              fields: [
                                "title_f^10",
                                "uploader_name^7",
                                "description^1",
                                "searchfor^6",
                              ],
                              type: "best_fields",
                              operator: "or",
                              fuzziness: "AUTO",
                            },
                          },
                          {
                            multi_match: {
                              query: searchVal,
                              fields: [
                                "title_f^10",
                                "uploader_name^7",
                                "description^1",
                                "searchfor^6",
                              ],
                              type: "phrase",
                              operator: "or",
                            },
                          },
                          {
                            multi_match: {
                              query: searchVal,
                              fields: [
                                "title_f^10",
                                "uploader_name^7",
                                "description^1",
                                "searchfor^6",
                              ],
                              type: "phrase_prefix",
                              operator: "or",
                            },
                          },
                        ],
                        minimum_should_match: 0,
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
      size: 10,
      _source: {
        includes: [
          "views",
          "likes",
          "uploader_name",
          "title",
          "uploader_image",
          "dislikes",
          "created_at",
          "video_path",
          "video_compress_path",
          "thumbnail_path",
          "description",
          "title_f",
          "video_duration",
        ],
        excludes: [],
      },
      from: 0,
    });

    // It might be useful to configure http control caching headers
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
    // res.setHeader('stale-while-revalidate', '30')
    console.log(response.hits.hits);
    res.json(response);
  } catch (err) {
    res.status(err.statusCode || 500);
    res.json({
      error: err.name,
      message: err.message,
      statusCode: err.statusCode || 500,
    });
  }
});

module.exports = router;
