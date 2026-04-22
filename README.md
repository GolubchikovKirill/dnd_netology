# Trello board

[![Build status](https://ci.appveyor.com/api/projects/status/put-your-project-id?svg=true)](https://ci.appveyor.com/project/put-your-login/put-your-repo)

GitHub Pages: https://put-your-login.github.io/dnd/

## Описание

Учебный проект по теме `Drag and Drop`. Сделана упрощённая версия Trello:

- три фиксированные колонки;
- добавление новых карточек;
- удаление карточек;
- перенос карточек внутри колонки и между колонками;
- сохранение состояния в `localStorage`.

DOM строится на основе состояния, которое хранится в браузере. После обновления страницы карточки остаются на своих местах.

## Запуск проекта

```bash
yarn install
yarn start
```

Для сборки production-версии:

```bash
yarn build
```

## Что ещё нужно сделать перед сдачей

1. Создать репозиторий на GitHub и запушить проект.
2. Настроить GitHub Pages для ветки с собранным проектом.
3. Вставить в `README.md` настоящую ссылку на Pages.
4. Заменить ссылку на бейдж Appveyor на свою.

## Примечание

В этом репозитории реализована обязательная часть задания `Trello`. Задачи со звёздочкой не делались.
