import { CHESS_STATUS, ROLE, SITE, CHESS_POS, CHESSBOARD_SIZE, CELL_SIZE, TOP } from '../constants';

const getChessSrc = (status: CHESS_STATUS, site: SITE, role: ROLE) => {
  if (status === CHESS_STATUS.INITIALIZED) {
    return 'chess_init_png';
  }
  if (status === CHESS_STATUS.TURNED) {
    return `chess_${site}_level_${role}_png`;
  }

  return 'chess_init_png';
}

const getChessPosX = (column: number) => {
  return column * CELL_SIZE + CHESS_POS.left;
}

const getChessPosY = (row: number) => {
  return row * CELL_SIZE + CHESS_POS.top;
}

export default class Chess extends egret.DisplayObjectContainer {
  // 第几行
  public row: number;
  // 第几列
  public column: number;
  // 状态
  public status: CHESS_STATUS;
  // 角色
  public role: ROLE;
  // 红蓝方
  public site: SITE;

  // 渲染 image url
  private imgSrc: string;

  // chess
  private chessBitmap: egret.Bitmap;

  private posX: number;
  private posY: number;

  constructor(row: number, column: number, status: CHESS_STATUS, role: ROLE, site: SITE) {
    super();
    this.row = row;
    this.column = column;
    
    // 设置状态
    this.status = status;
    // 设置角色
    this.role = role;
    // 设置
    this.site = site;

    this.posX = getChessPosX(this.column);
    this.posY = getChessPosY(this.row);
    
    this.imgSrc = getChessSrc(this.status, this.site, this.role);
    this.render();
  }

  public moveTo(row: number, column: number) {
    this.row = row;
    this.column = column;
    this.posX = getChessPosX(this.column);
    this.posY = getChessPosY(this.row);

    this.imgSrc = getChessSrc(this.status, this.site, this.role);
    this.render()
  }

  // 反转棋子
  public turnChess() {
    if (this.status === CHESS_STATUS.TURNED) return;

    this.status = CHESS_STATUS.TURNED;
    this.imgSrc = getChessSrc(this.status, this.site, this.role);
    this.render();
  }

  public checkCollision(stageX: number, stageY: number): boolean {
    var bResult: boolean = this.chessBitmap.hitTestPoint(stageX, stageY);
    return bResult;
  }

  private createBitmapByName(name: string) {
    let result = new egret.Bitmap();
    let texture: egret.Texture = RES.getRes(name);
    result.texture = texture;
    return result;
  }

  public destroy() {
    this.removeChild(this.chessBitmap);
  }

  private isTurned() {
    return this.status === CHESS_STATUS.TURNED;
  }

  render() {
    if (this.chessBitmap) {
      this.removeChild(this.chessBitmap);
    }
    let chess = this.createBitmapByName(this.imgSrc);
    chess.width = CELL_SIZE;
    chess.height = CELL_SIZE;
    chess.x = this.posX;
    chess.y = this.posY;
    this.chessBitmap = chess;
    this.addChild(chess);
  }
}
