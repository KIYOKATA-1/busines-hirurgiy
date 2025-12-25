export default function Loading() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.spinner} />
    </div>
  );
}

const styles = {
  wrapper: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#02040a", 
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid rgba(255,255,255,0.15)",
    borderTop: "3px solid #ffffff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};
