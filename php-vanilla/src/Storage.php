<?php

class Storage
{
    private string $file;

    public function __construct(string $file)
    {
        $this->file = $file;
        if (!file_exists($this->file)) {
            file_put_contents($this->file, json_encode(['projects' => [], 'tasks' => []], JSON_PRETTY_PRINT));
        }
    }

    public function read(): array
    {
        $json = file_get_contents($this->file);
        $data = json_decode($json, true);
        if (!is_array($data)) {
            $data = ['projects' => [], 'tasks' => []];
        }
        return $data;
    }

    public function write(array $data): void
    {
        file_put_contents($this->file, json_encode($data, JSON_PRETTY_PRINT));
    }

    public function update(callable $callback): array
    {
        $data = $this->read();
        $updated = $callback($data) ?? $data;
        $this->write($updated);
        return $updated;
    }
}
