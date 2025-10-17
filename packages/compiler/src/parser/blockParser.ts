/**
 * BlockParser - <script>, <template>, <style> bloklarını ayırır
 * Türkçe: Bu sınıf, .ack dosyasını üç ana blok'a ayırmayı sağlar.
 */

export interface ParsedBlocks {
  script: string;
  template: string;
  style: string;
}

export class BlockParser {
  private source: string;

  constructor(source: string) {
    this.source = source;
  }

  /**
   * Bloklarını parse et.
   */
  public parse(): ParsedBlocks {
    const blocks: ParsedBlocks = {
      script: '',
      template: '',
      style: '',
    };

    // Her blok için regex kullanarak içeriği ayıkla
    blocks.script = this.extractBlock('script');
    blocks.template = this.extractBlock('template');
    blocks.style = this.extractBlock('style');

    return blocks;
  }

  /**
   * Belirtilen türdeki blok'u ayıkla.
   */
  private extractBlock(blockType: 'script' | 'template' | 'style'): string {
    const openingTag = `<${blockType}`;
    const closingTag = `</${blockType}>`;

    const openIndex = this.source.indexOf(openingTag);
    if (openIndex === -1) {
      return '';
    }

    // Açılış tag'ının sonunu bularak içeriği başlat
    const contentStart = this.source.indexOf('>', openIndex);
    if (contentStart === -1) {
      return '';
    }

    const closeIndex = this.source.indexOf(closingTag, contentStart);
    if (closeIndex === -1) {
      return '';
    }

    // İçeriği ayıkla
    const content = this.source.substring(contentStart + 1, closeIndex).trim();
    return content;
  }

  /**
   * Script bloğunun içeriğini döndür.
   */
  public getScriptContent(): string {
    return this.extractBlock('script');
  }

  /**
   * Template bloğunun içeriğini döndür.
   */
  public getTemplateContent(): string {
    return this.extractBlock('template');
  }

  /**
   * Style bloğunun içeriğini döndür.
   */
  public getStyleContent(): string {
    return this.extractBlock('style');
  }
}
