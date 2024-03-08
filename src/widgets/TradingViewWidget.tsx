import { useEffect } from 'react';

const TradingViewWidget = () => {
  useEffect(() => {
    // Create a script element
    const script = document.createElement('script');
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      "symbol": "COINBASE:BTCUSD",
      "width": 350,
      "height": 220,
      "locale": "en",
      "dateRange": "1M",
      "colorTheme": "light",
      "isTransparent": false,
      "autosize": false,
      "largeChartUrl": ""
    });

    // Append script to here id
    document.getElementById('here').appendChild(script);


    // Cleanup function to remove script from the body on component unmount
    return () => {
      document.getElementById('here').removeChild(script);
    };
  }, []);

  return (
    <div className='p-10 justify-center content-center content-center'>
      <div id="here" className='mx-auto'></div>
    </div>
  );
};

export default TradingViewWidget;
