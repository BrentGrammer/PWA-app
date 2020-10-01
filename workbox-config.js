module.exports = {
  globDirectory: "public/",
  globPatterns: [
    "**/*.{html,ico,json,css}",
    "src/js/*.min.js",
    "src/images/*.{jpg,png}",
  ],
  swSrc: "public/sw-base.js",
  swDest: "public/service-worker.js",
  globIgnores: ["../workbox-config.js", "help/**", "404.html"],
};
