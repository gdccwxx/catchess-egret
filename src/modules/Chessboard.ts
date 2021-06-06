import {
  CHESS_STATUS,
  ROLE,
  SITE,
  CHESS_COUNT,
  CELL_NUM,
  EAT_RULE,
  LEVEL_NAME_MAP,
  SITE_NAME_MAP,
  BORDER_CHESS,
  CHESSBOARD_SIZE,
  CELL_SIZE,
  TOP,
  CHESS_BOARD_BORDER,
  screenWidth,
  CHESS_POS,
} from '../constants';
import Chess from './Chess';
import { shuffle } from '../utils';

export default class Chessboard extends egret.DisplayObjectContainer {
  // 棋子列表
  private chesses = [];
  
  // 选中的棋子
  private selectedChess = null;
  // 轮到哪方了
  private turnedSite = SITE.UNINITIALIZED;

  private siteLabel: egret.TextField;
  private choiceLabel: egret.TextField;

  public constructor() {
    super();
    this.restart();
  }

  private restart() {
    // 这一步放在后端
    this.turnedSite = Math.random() > 0.5 ? SITE.RED : SITE.BLUE;
    this.renderChessboard();
    this.initChess();
    setTimeout(() => {
      this.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.touchHandler, this);
    }, 30);
    this.writeSite();
  }

  // 初始化棋子
  private initChess() {
    const fillArray = [];
    for (let key in CHESS_COUNT) {
      for (let i = 0; i < CHESS_COUNT[key]; i++) {
        fillArray.push({
          status: CHESS_STATUS.INITIALIZED,
          role: ROLE[key],
          site: SITE.RED,
        });
        fillArray.push({
          status: CHESS_STATUS.INITIALIZED,
          role: ROLE[key],
          site: SITE.BLUE,
        });
      }
    }

    const shuffledArray = shuffle(fillArray);
    const shuffledArrayLen = shuffledArray.length;
    const result = [];
    for (let rowIndex = 0; rowIndex < shuffledArrayLen / CELL_NUM; rowIndex += 1) {
      const row = shuffledArray.slice(rowIndex * CELL_NUM, (rowIndex + 1) * CELL_NUM);
      const tempResult = [];
      row.forEach((item, columnIndex) => {
        const chess = new Chess(rowIndex, columnIndex, item.status, item.role, item.site);
        this.addChild(chess);
        tempResult.push(chess);
      });
      result.push(tempResult);
    }

    this.chesses = result;
  }

  private touchHandler(evt: egret.TouchEvent) {
    this.chesses.forEach((chessRow) => {
      chessRow.forEach((chess: Chess) => {
        if (chess && chess.checkCollision(evt.stageX, evt.stageY)) {
          this.onChessStep(chess.row, chess.column);
        }
      });
    });
  }

  // 判断是否需要下一步
  onChessStep(row: number, column: number) {
    if (this.isPosEmpty(row, column) && this.selectedChess) {
      this.moveChess(row, column);
      this.toggleSite();
      return;
    }

    // 如果位置上有棋子, 可以吃
    if (
      !this.isPosEmpty(row, column)
      && this.selectedChess
    ) {
      // 吃掉棋子
      if (this.couldEat(this.selectedChess, this.chesses[row][column])) {
        this.eatChess(row, column);
        console.log('eat');
        console.log(this.chesses);
        return;
      }

    }

    // 判断是否点击的是空
    if (this.selectedChess === null && this.isPosEmpty(row, column)) {
      return;
    }

    // 判断是否需要反转棋子
    if (!this.isPosEmpty(row, column) && !this.isChessTurned(row, column)) {
      this.onTurnChess(row, column);
      return;
    }

    // 选中棋子
    if (this.turnedSite === this.getChessSite(row, column)) {
      this.onSelectChess(row, column);
      return;
    }
  }

  // 选择棋子
  private onSelectChess(row: number, column: number) {
    if (this.getChessSite(row, column) !== this.turnedSite) {
      return;
    }

    this.selectedChess = this.chesses[row][column];
    this.writeChoicePos();
  }

  // 检查棋子类型
  private getChessSite(row: number, column: number) {
    if (this.isPosEmpty(row, column)) {
      console.warn('their is no chess on that position');
      return;
    }

    if (!this.isChessTurned(row, column)) {
      console.warn('their is no turned that position');
      return;
    }

    return this.chesses[row][column].site;
  }

  // 吃掉棋子
  private eatChess(beEatRow: number, beEatColumn: number) {
    if (!this.selectedChess) {
      console.warn('none select chesses, can not eat');
      return;
    }

    const { row, column } = this.selectedChess;
    if (this.couldEat(this.selectedChess, this.chesses[beEatRow][beEatColumn])) {
      this.chesses[beEatRow][beEatColumn] = this.selectedChess;
      this.chesses[row][column] = null;

      this.selectedChess.moveTo(beEatRow, beEatColumn);
      this.clearSelectedChess();
      this.toggleSite();
    }
  }

  // 棋子是否被反转
  private isChessTurned(row: number, column: number) {
    if (this.chesses[row][column] !== null) {
      return this.chesses[row][column].status === CHESS_STATUS.TURNED;
    }

    return false;
  }

  // 翻开棋子
  private onTurnChess(row: number, column: number) {
  !this.isChessTurned(row, column) && this.chesses[row][column].turnChess();
    this.toggleSite();
  }

  // 是否可以吃掉棋子
  private couldEat(chess: Chess, beEatChess: Chess) {
    if (chess.site === beEatChess.site || chess.status !== CHESS_STATUS.TURNED || beEatChess.status !== CHESS_STATUS.TURNED) {
      return false;
    }
    const rowIndexAbs = Math.abs(chess.row - beEatChess.row);
    const columnIndexAbs = Math.abs(chess.column - beEatChess.column);
    if ((rowIndexAbs === 0 && columnIndexAbs === 1) || (rowIndexAbs === 1 && columnIndexAbs === 0)) {
      return EAT_RULE[chess.role].includes(beEatChess.role);
    }

    return false;
  }


  private moveChess(row: number, column: number) {
    if (!this.selectedChess) {
      return;
    }

    this.chesses[this.selectedChess.row][this.selectedChess.column] = null;
    this.chesses[row][column] = this.selectedChess;

    this.chesses[row][column].moveTo(row, column);
  }

  // 当前位置是否是空的
  private isPosEmpty(row: number, column: number) {
    return this.chesses[row][column] === null;
  }

  // 清空选中的棋子
  private clearSelectedChess() {
    this.selectedChess = null;
    this.writeChoicePos();
  }

  private toggleSite() {
    this.clearSelectedChess();
    if (this.turnedSite === SITE.RED) {
      this.turnedSite = SITE.BLUE;
      console.log('now site: BLUE');
      this.writeSite();
      return;
    }

    if (this.turnedSite === SITE.BLUE) {
      this.turnedSite = SITE.RED;
      console.log('now site: RED');
      this.writeSite();
      return;
    }
  }

  writeSite() {
    if (!this.siteLabel) {
      this.siteLabel = new egret.TextField();
      this.siteLabel.textColor = 0xffffff;
      this.siteLabel.width = 240;
      this.siteLabel.textAlign = "center";
      this.siteLabel.size = 30;
      this.siteLabel.x = 200;
      this.siteLabel.y = 50;
    }
    this.siteLabel.text = `${SITE_NAME_MAP[this.turnedSite]} 执棋`;
    this.addChild(this.siteLabel);
  }

  writeChoicePos() {
    const text = this.selectedChess !== null
      ? `选中: ${LEVEL_NAME_MAP[this.selectedChess.role]}[${this.selectedChess.row + 1}, ${this.selectedChess.column + 1}]`
      : '未选中';

    if (!this.choiceLabel) {
      this.choiceLabel = new egret.TextField();
      this.choiceLabel.textColor = 0xffffff;
      this.choiceLabel.width = 240;
      this.choiceLabel.textAlign = "center";
      this.choiceLabel.size = 30;
      this.choiceLabel.x = 200;
      this.choiceLabel.y = 120;
    }
    this.choiceLabel.text = text;
    this.addChild(this.choiceLabel);
  }
  public renderChessboard () {
    for (let i = 0; i < CELL_NUM + 1; i++) {
      let linePortable = new egret.Shape();
      linePortable.graphics.lineStyle(CHESS_BOARD_BORDER, 0xBFBFBF);
      // 点到点的划线，起点是棋盘左侧，再加每个格子
      linePortable.graphics.moveTo(CHESS_POS.left, CHESS_POS.top + CELL_SIZE * i);
      linePortable.graphics.lineTo(CHESS_POS.right, CHESS_POS.top + CELL_SIZE * i);
      console.log(CHESS_POS.left, CHESS_POS.top + CELL_SIZE * i);
      linePortable.graphics.endFill();
      this.addChild(linePortable);

      let lineLandscape = new egret.Shape();
      lineLandscape.graphics.lineStyle(CHESS_BOARD_BORDER, 0xBFBFBF);
      lineLandscape.graphics.moveTo(CHESS_POS.left + CELL_SIZE * i, CHESS_POS.top);
      lineLandscape.graphics.lineTo(CHESS_POS.left + CELL_SIZE * i, CHESS_POS.bottom);
      lineLandscape.graphics.endFill();
      this.addChild(lineLandscape);
    }
  }
}