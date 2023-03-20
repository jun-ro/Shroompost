// CAUSE IM SO TIRED OF THE STUPID SET TIMEOUT FUNCTION HOLY.



export class Butler{
    constructor() {
      this.timers = [];
    }
    
    wait(timeInSeconds) {
      return new Promise((resolve) => {
        const timerId = setTimeout(() => {
          this.timers = this.timers.filter((id) => id !== timerId);
          resolve();
        }, timeInSeconds * 1000);
        this.timers.push(timerId);
      });
    }
  
    clearAllTimers() {
      this.timers.forEach((id) => clearTimeout(id));
      this.timers = [];
    }
  }
  
  