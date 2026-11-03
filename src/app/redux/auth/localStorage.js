export const token = typeof window !== 'undefined' ? (localStorage.getItem("token") || localStorage.getItem("accesstoken")) : null;
export const UserId = typeof window !== 'undefined' ? parseInt(localStorage.getItem("userId") || localStorage.getItem("UserId") || "0") : null;
export const OrganizationId = typeof window !== 'undefined' ? parseInt(localStorage.getItem("Organization_Id") || localStorage.getItem("orgDetail") || localStorage.getItem("OrganizationId") || "0") : null;
export const DBname = "crmuseradmin1";

export const FormatAmount = (amount) => {
  return Boolean(amount) ? amount?.toLocaleString() : NaN;
};

export const AutoHeight = (hei = 1.5) => {
  const [height, setHeight] = require("react").useState(
    typeof window !== 'undefined' ? window.innerHeight / hei : 500
  );

  require("react").useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setHeight(window.innerHeight / hei);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [hei]);

  return height;
};
