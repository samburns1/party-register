export default function DesignRef() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Design Reference</h1>
      <p className="mb-4 text-gray-600">
        This is the Figma design reference. Use this to extract SVG assets and copy CSS values from Dev Mode.
        This page is not part of the production app.
      </p>
      <iframe
        style={{border:'1px solid rgba(0,0,0,0.1)', width:'100%', height:'80vh'}}
        src="https://embed.figma.com/design/tF7MVlIhhkl25PUYMQHmPh/1306?node-id=0-1&embed-host=share"
        allowFullScreen
      />
    </div>
  );
}