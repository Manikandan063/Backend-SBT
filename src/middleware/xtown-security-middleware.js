export default function xtownSecurity(options) {
    return (req, res, next) => {
        console.log("Monitoring:", req.method, req.originalUrl);

        next();
    };
}