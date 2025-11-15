<?php

class Renderer
{
    private string $layout;

    public function __construct(string $layoutPath)
    {
        $this->layout = file_get_contents($layoutPath);
    }

    public function render(array $meta, string $bodyHtml, string $actionsHtml = '', string $extraScripts = ''): string
    {
        $dom = new DOMDocument('1.0', 'UTF-8');
        libxml_use_internal_errors(true);
        $dom->loadHTML($this->layout, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();
        $xpath = new DOMXPath($dom);

        if ($meta['routeLabel'] ?? null) {
            $labelNode = $xpath->query('//*[@data-slot="route-label"]')->item(0);
            if ($labelNode) {
                $labelNode->nodeValue = $meta['routeLabel'];
            }
        }

        if ($meta['panelTitle'] ?? null) {
            $titleNode = $xpath->query('//*[contains(@class,"panel-title")]')->item(0);
            if ($titleNode) {
                $titleNode->nodeValue = $meta['panelTitle'];
            }
        }

        $actionsNode = $xpath->query('//*[@data-slot="panel-actions"]')->item(0);
        if ($actionsNode) {
            while ($actionsNode->firstChild) {
                $actionsNode->removeChild($actionsNode->firstChild);
            }
            if ($actionsHtml) {
                $fragment = $dom->createDocumentFragment();
                $fragment->appendXML($actionsHtml);
                $actionsNode->appendChild($fragment);
            }
        }

        $bodyNode = $xpath->query('//*[@data-slot="panel-body"]')->item(0);
        if ($bodyNode) {
            while ($bodyNode->firstChild) {
                $bodyNode->removeChild($bodyNode->firstChild);
            }
            $fragment = $dom->createDocumentFragment();
            $fragment->appendXML($bodyHtml);
            $bodyNode->appendChild($fragment);
        }

        $userNode = $xpath->query('//*[@data-slot="user-display"]')->item(0);
        if ($userNode && isset($meta['userLabel'])) {
            $userNode->nodeValue = $meta['userLabel'];
        }

        $bodyElement = $dom->getElementsByTagName('body')->item(0);
        if ($bodyElement && ($meta['authMode'] ?? false)) {
            $existing = $bodyElement->getAttribute('class');
            $bodyElement->setAttribute('class', trim($existing . ' auth-mode'));
        }

        if ($extraScripts) {
            $fragment = $dom->createDocumentFragment();
            $fragment->appendXML($extraScripts);
            $bodyElement->appendChild($fragment);
        }

        return $dom->saveHTML();
    }
}
