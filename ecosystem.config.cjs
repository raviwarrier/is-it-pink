module.exports = {
  apps: [
    {
      name: "is-it-pink",
      cwd: "/PATH/TO/is-it-pink", //remember to add instructions for this to readme.md as well 
      script: "./dist/server.cjs",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        //HOST: "192.168.68.102" //OPTIONAL IF YOU WANT TO BIND IT
      }
    }
  ]
};
