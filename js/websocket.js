class WebSocketManager {
  constructor(GlobalManager, functionHandler, Marquee, Station) {
    this.GlobalManager = GlobalManager;
    this.functionHandler = functionHandler;
    this.Marquee = Marquee;
    this.Station = Station;
    this.wsURL = "wss://jp-eq.cstrike.asia/ws";
    this.API_KEY = "金鑰貼這裡";
    this.ws = null;
  }

  connectWebSocket() {
    this.ws = new WebSocket(this.wsURL);
    this.ws.addEventListener("open", (event) => {
      console.log("WebSocket connected");
      this.sendWebSocketMessage({ type: "region", token: this.API_KEY });
      this.sendWebSocketMessage({ type: "rts", token: this.API_KEY });
      this.sendWebSocketMessage({ type: "eew", token: this.API_KEY });
      this.sendWebSocketMessage({ type: "jmaEEW", token: this.API_KEY });
      this.sendWebSocketMessage({ type: "report", token: this.API_KEY });
      this.sendWebSocketMessage({ type: "jmaReport", token: this.API_KEY });
      this.sendWebSocketMessage({ type: "jmaTsunami", token: this.API_KEY });
      this.sendWebSocketMessage({ type: "station", token: this.API_KEY });
    });
    this.ws.addEventListener("error", (event) => {
      console.error("WebSocket error:", event);
    });
    this.ws.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    });
    this.ws.addEventListener("close", (event) => {
      console.log("WebSocket connection closed. Reconnecting...");
      setTimeout(() => this.connectWebSocket(), 2000);
    });
  }

  sendWebSocketMessage(t) {
    const json = JSON.stringify(t);
    const encodedData = btoa(unescape(encodeURIComponent(json)));
    if (this.ws.readyState == WebSocket.OPEN) {
      this.ws.send(encodedData);
    } else {
      console.error("WebSocket is not connection yet.");
    }
  }

  handleMessage(data) {
    switch (data.t) {
      case "region":
        this.GlobalManager.region = data;
        break;
      case "rts":
        if (this.Station) {
          this.Station.on_rts_data(data);
        }
        break;
      case "report":
        this.GlobalManager.news_msg.tw =
          this.functionHandler.reportFormat(data);
        setTimeout(() => {
          this.Marquee.news(this.GlobalManager.news_msg.tw, "台灣");
        }, 0);
        break;
      case "station":
        if (this.Station) {
          this.Station.station_exec(data);
          this.Station.SelectStation();
        }
        break;
      case "forbidden":
        alert("錯誤的金鑰");
        break;
      case "jmaReport":
        this.GlobalManager.news_msg.jp =
          this.functionHandler.reportFormat(data);
        setTimeout(() => {
          this.Marquee.news(this.GlobalManager.news_msg.jp, "日本");
        }, 0);
        break;
      case "jmaEEW":
        if (data?.type) {
          this.Station.on_eew_jp(data);
        }
        break;
      case "jmaTsunami":
        if (data?.warnings?.length) {
          this.Marquee.tsunami(data);
          break;
        }
      default:
        if (this.Station && data?.type) {
          this.Station.on_eew(data);
        }
        break;
    }
  }
}
window.WebSocketManager = new WebSocketManager(
  window.GlobalManager,
  window.functionHandler,
  window.MarqueeManager,
  window.StationManager
);
window.WebSocketManager.connectWebSocket();
window.StationManager.SelectStation();
