module.exports = {
  apps: [
    {
      name: "is-it-pink",
      cwd: "/PATH/TO/is-it-pink", // Update this to the absolute path of your is-it-pink directory (e.g. /home/user/is-it-pink)
      script: "./dist/server.cjs",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 4260
        // HOST: "192.168.68.102" // Optional: Bind to specific IP address if desired
      }
    }
  ]
};
