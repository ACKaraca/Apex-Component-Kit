/**
 * The BlockParser class is responsible for separating an .ack file's content
 * into its three main constituent blocks: `<script>`, `<template>`, and `<style>`.
 * @class BlockParser
 */

/**
 * An interface representing the separated blocks of an .ack file.
 * @interface ParsedBlocks
 * @property {string} script - The content of the `<script>` block.
 * @property {string} template - The content of the `<template>` block.
 * @property {string} style - The content of the `<style>` block.
 */
export interface ParsedBlocks {
  script: string;
  template: string;
  style: string;
}

export class BlockParser {
  private source: string;

  /**
   * Creates an instance of BlockParser.
   * @param {string} source The raw source code of the .ack file.
   */
  constructor(source: string) {
    this.source = source;
  }

  /**
   * Parses the source code and extracts the content of the script, template, and style blocks.
   * @returns {ParsedBlocks} An object containing the content of each block.
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
