module.exports = {
  apps: [
    {
      name: 'is-it-pink',
      script: './dist/server.cjs',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4260
      }
    }
  ]
};
