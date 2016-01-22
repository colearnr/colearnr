process.on('SIGUSR1', function () {
    console.log("Exiting. Uptime:", process.uptime(), "sec");
    process.exit(0);
});

process.on('SIGINT', function () {
    console.log("Exiting after ctrl+c. Uptime:", process.uptime(), "sec");
    process.exit(0);
});

process.on('SIGHUP', function () {
    console.log("Exiting after HUP signal. Uptime:", process.uptime(), "sec");
    process.exit(0);
});
