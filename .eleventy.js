// 11ty Plugins
const socialImages = require("@11tyrocks/eleventy-plugin-social-images");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginRss = require("@11ty/eleventy-plugin-rss");

// Helper packages
const slugify = require("slugify");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");

// Local utilities/data
const packageVersion = require("./package.json").version;
const sanitizeHTML = require('sanitize-html');


module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(socialImages);
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(pluginRss);

  eleventyConfig.addWatchTarget("./src/sass/");

  eleventyConfig.addPassthroughCopy("./src/css");
  eleventyConfig.addPassthroughCopy("./src/fonts");
  eleventyConfig.addPassthroughCopy("./src/img");
  eleventyConfig.addPassthroughCopy("./src/favicon.png");

  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);
  eleventyConfig.addShortcode("packageVersion", () => `v${packageVersion}`);

  eleventyConfig.addFilter("slug", (str) => {
    if (!str) {
      return;
    }

    return slugify(str, {
      lower: true,
      strict: true,
      remove: /["]/g,
    });
  });

  /* Markdown Overrides */
  let markdownLibrary = markdownIt({
    html: true,
  }).use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.ariaHidden({
      class: "tdbc-anchor",
      space: false,
    }),
    level: [1, 2, 3],
    slugify: (str) =>
      slugify(str, {
        lower: true,
        strict: true,
        remove: /["]/g,
      }),
  });
  eleventyConfig.setLibrary("md", markdownLibrary);
  eleventyConfig.addNunjucksFilter("formatDate", (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });
  eleventyConfig.addNunjucksFilter("getImageUrlFromIsbn", (isbn) => {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
  });
  eleventyConfig.addCollection("readBooks", function (collectionApi) {
    return collectionApi.getFilteredByTags("book", "read");
  });
  eleventyConfig.addCollection("wantToReadBooks", function (collectionApi) {
    return collectionApi.getFilteredByTags("book", "queued");
  });
  eleventyConfig.addCollection("allBooks", function (collectionApi) {
    return collectionApi.getFilteredByTags("book");
  });
  eleventyConfig.addFilter("uniUrlFilter", (data) => {
    return encodeURI(data)
  })
  eleventyConfig.addFilter('getWebmentionsForUrl', (webmentions, url) => {
    const likes = ['like-of'];
    const retweet = ['repost-of'];
    const messages = ['mention-of', 'in-reply-to'];

    const hasRequiredFields = entry => {
      const { author, published, content } = entry;
      return author.name && published && content;
    };
    const sanitize = entry => {
      const { content } = entry;
      if (content['content-type'] === 'text/html') {
        content.value = sanitizeHTML(content.value);
      }
      return entry;
    };

    return {
      'likes': webmentions
        .filter(entry => entry['wm-target'] === url)
        .filter(entry => likes.includes(entry['wm-property'])),
      'retweet': webmentions
        .filter(entry => entry['wm-target'] === url)
        .filter(entry => retweet.includes(entry['wm-property']))
        .filter(hasRequiredFields)
        .map(sanitize),
      'messages': webmentions
        .filter(entry => entry['wm-target'] === url)
        .filter(entry => messages.includes(entry['wm-property']))
        .filter(hasRequiredFields)
        .map(sanitize)
    };
  })

  return {
    passthroughFileCopy: true,
    dir: {
      input: "src",
      output: "public",
      layouts: "_layouts",
    },
  };
};
