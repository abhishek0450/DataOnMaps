import "./InfoCard.css";

const InfoCard = ({ data, onClose }) => {
  if (!data) return null;

  const locationText = data.city || data.district
    ? `${data.city || data.district}, ${data.state}`
    : data.state || "Not available";

  const details = [
    { label: "Type", value: data.facility_type },
    { label: data.city || data.district ? "Location" : "State", value: locationText },
    { label: "Capacity", value: data.capacity_mtpa ? `${data.capacity_mtpa} MTPA` : null },
    { label: "Established", value: data.established_year || null },
    { label: "Description", value: data.description || null },
  ].filter((item) => item.value);

  return (
    <aside className="info-card">
      <div className="info-card-header">
        <div>
          <p className="info-card-kicker">Facility Details</p>
          <h2 className="title">{data.name}</h2>
        </div>

        <button className="close-btn" onClick={onClose} aria-label="Close details">×</button>
      </div>

      <div className="info-card-body">
        {details.map((detail) => (
          <div className="info-row" key={detail.label}>
            <span className="info-label">{detail.label}</span>
            <span className="info-value">{detail.value}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default InfoCard;